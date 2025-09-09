"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.WhatsAppController = void 0;
const twilioService_1 = require("../services/twilioService");
const supabaseClient_1 = require("../supabaseClient");
const logger_1 = require("../middleware/logger");
function isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}
class WhatsAppController {
    async handleWebhook(req, res) {
        try {
            console.log('🎯 === WEBHOOK DEBUGGING START ===');
            console.log('📥 Content-Type:', req.headers['content-type']);
            console.log('📥 Raw Body:', JSON.stringify(req.body, null, 2));
            console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
            const isFormEncoded = req.headers['content-type']?.includes('application/x-www-form-urlencoded');
            const isJSON = req.headers['content-type']?.includes('application/json');
            let Body, From, To;
            if (isFormEncoded) {
                Body = req.body.Body;
                From = req.body.From;
                To = req.body.To;
            }
            else if (isJSON) {
                ({ Body: Body, From: From, To: To } = req.body);
            }
            else {
                Body = req.body?.Body || req.body?.body;
                From = req.body?.From || req.body?.from;
                To = req.body?.To || req.body?.to;
            }
            console.log('📱 Extracted Data:', { Body, From, To });
            if (!Body || !From) {
                const error = `Missing fields: Body=${!!Body}, From=${!!From}`;
                console.log('❌', error);
                logger_1.logger.error('Invalid webhook payload', null, {
                    received: req.body,
                    contentType: req.headers['content-type'],
                    source: 'WhatsAppController > handleWebhook',
                });
                return res.status(400).json({
                    error,
                    received: req.body,
                    contentType: req.headers['content-type']
                });
            }
            const normalizedFrom = (From || '').trim();
            console.log('🔧 Normalized From:', normalizedFrom);
            if (!normalizedFrom || !normalizedFrom.startsWith('whatsapp:')) {
                console.error('❌ Invalid phone format:', normalizedFrom);
                logger_1.logger.error('Invalid or missing From number', null, {
                    from: normalizedFrom,
                    source: 'WhatsAppController > handleWebhook',
                });
                return res.status(400).json({ error: 'Invalid phone number format' });
            }
            const userPhone = normalizedFrom;
            const command = Body?.trim().toLowerCase();
            console.log('✅ Validated values:', { userPhone, command });
            logger_1.logger.info('WhatsApp message received', {
                phoneNumber: userPhone,
                message: Body,
                source: 'WhatsAppController > handleWebhook',
            });
            const isTestMode = req.headers['x-test'] === 'true' || userPhone.includes('+14155238886');
            console.log('🧪 Test mode:', isTestMode);
            let responseMessage = '';
            try {
                if (command === '/start' || command === '/help') {
                    logger_1.logger.info('Sending help message', { userPhone, command });
                    responseMessage = `👋 Welcome to Group Deals! Use:
/deals - View active deals
/join <deal_number> - Join a deal (e.g., /join 1)
/mydeals - View your deals`;
                    if (isTestMode) {
                        return res.status(200).json({
                            success: true,
                            response: responseMessage,
                            debug: {
                                originalMessage: Body,
                                processedMessage: command,
                                phoneNumber: userPhone,
                                timestamp: new Date().toISOString()
                            }
                        });
                    }
                    await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                    logger_1.logger.info('Help message sent successfully', { userPhone });
                    return res.sendStatus(200);
                }
                if (command === '/deals') {
                    logger_1.logger.info('Fetching active deals for user', { userPhone });
                    const { data: deals, error } = await supabaseClient_1.supabase
                        .from('deals')
                        .select('*')
                        .eq('status', 'active')
                        .order('created_at', { ascending: true })
                        .limit(5);
                    if (error) {
                        logger_1.logger.error('Failed to fetch active deals', error, {
                            userPhone,
                            source: 'WhatsAppController > /deals',
                        });
                        responseMessage = '🚫 Error fetching deals.';
                    }
                    else if (!deals?.length) {
                        logger_1.logger.info('No active deals found', { userPhone });
                        responseMessage = '🚫 No active deals found.';
                    }
                    else {
                        logger_1.logger.info('Active deals found', { userPhone, dealCount: deals.length });
                        responseMessage = '🔥 *Active Group Deals* 🔥\n\n';
                        deals.forEach((deal, index) => {
                            responseMessage += `*${index + 1}. ${deal.product_name}*\n`;
                            responseMessage += `💰 ₹${deal.original_price} → ₹${deal.group_price}\n`;
                            responseMessage += `👥 ${deal.current_participants}/${deal.max_participants} joined\n`;
                            responseMessage += `⏰ Ends: ${new Date(deal.end_time).toLocaleDateString()}\n`;
                            responseMessage += `📱 Join: /join ${index + 1}\n\n`;
                        });
                        responseMessage += 'Reply with /join [number] to participate! 🚀';
                    }
                    if (isTestMode) {
                        return res.status(200).json({
                            success: true,
                            response: responseMessage,
                            debug: {
                                originalMessage: Body,
                                processedMessage: command,
                                phoneNumber: userPhone,
                                timestamp: new Date().toISOString()
                            }
                        });
                    }
                    await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                    logger_1.logger.info('Deals list sent successfully', { userPhone, dealCount: deals?.length || 0 });
                    return res.sendStatus(200);
                }
                if (command.startsWith('/join')) {
                    console.log('🔁 === HANDLING /JOIN COMMAND ===');
                    console.log('📝 Full command:', command);
                    const parts = command.split(' ');
                    const dealIdentifier = parts[1]?.trim();
                    console.log('🔍 Command parts:', parts);
                    console.log('🎯 Deal identifier parsed:', dealIdentifier);
                    logger_1.logger.info('User attempting to join deal', { userPhone, dealIdentifier, command });
                    if (!dealIdentifier) {
                        console.error('❌ No deal identifier provided');
                        logger_1.logger.warn('Missing deal identifier in join command', null, { userPhone, command });
                        responseMessage = '❗ Usage: /join <deal_number>\n\nUse /deals to see available offers.';
                        if (isTestMode) {
                            return res.status(200).json({
                                success: true,
                                response: responseMessage,
                                debug: {
                                    originalMessage: Body,
                                    processedMessage: command,
                                    phoneNumber: userPhone,
                                    error: 'Missing deal identifier'
                                }
                            });
                        }
                        await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                        return res.sendStatus(200);
                    }
                    try {
                        let dealId;
                        console.log('🔍 === SMART DEAL MAPPING ===');
                        if (/^\d+$/.test(dealIdentifier)) {
                            console.log('🔢 User sent a number, mapping to UUID...');
                            const dealIndex = parseInt(dealIdentifier) - 1;
                            console.log('📊 Fetching deals for index mapping...', { dealIndex });
                            const { data: deals, error: dealsError } = await supabaseClient_1.supabase
                                .from('deals')
                                .select('id, product_name')
                                .eq('status', 'active')
                                .order('created_at', { ascending: true });
                            console.log('📋 Deals fetch result:', {
                                dealsCount: deals?.length || 0,
                                dealsError,
                                requestedIndex: dealIndex
                            });
                            if (dealsError || !deals || dealIndex < 0 || dealIndex >= deals.length) {
                                console.error('❌ Invalid deal index or fetch error:', { dealsError, dealIndex, dealsLength: deals?.length });
                                responseMessage = "❌ Invalid deal number. Send /deals to see available options.";
                                if (isTestMode) {
                                    return res.status(200).json({
                                        success: false,
                                        response: responseMessage,
                                        debug: {
                                            error: 'Invalid deal index',
                                            dealIdentifier,
                                            dealIndex,
                                            availableDeals: deals?.length || 0
                                        }
                                    });
                                }
                                await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                                return res.sendStatus(200);
                            }
                            dealId = deals[dealIndex].id;
                            console.log(`🔄 Mapped deal ${dealIdentifier} to UUID:`, dealId);
                        }
                        else if (isValidUUID(dealIdentifier)) {
                            dealId = dealIdentifier;
                            console.log('🆔 Using provided UUID:', dealId);
                        }
                        else {
                            console.error('❌ Invalid deal format:', dealIdentifier);
                            responseMessage = "❌ Invalid deal format. Use /join 1 or /join <uuid>";
                            if (isTestMode) {
                                return res.status(200).json({
                                    success: false,
                                    response: responseMessage,
                                    debug: {
                                        error: 'Invalid deal format',
                                        dealIdentifier
                                    }
                                });
                            }
                            await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                            return res.sendStatus(200);
                        }
                        console.log('✅ Final deal ID to use:', dealId);
                        console.log('🔍 Fetching deal details from database...');
                        const { data: deal, error: dealError } = await supabaseClient_1.supabase
                            .from('deals')
                            .select('id, product_name, group_price, current_participants, max_participants, min_participants, status')
                            .eq('id', dealId)
                            .eq('status', 'active')
                            .single();
                        console.log('📊 Deal fetch result:', { deal, dealError });
                        if (dealError || !deal) {
                            console.error('❌ Deal not found or error:', dealError);
                            logger_1.logger.error('Deal not found or not active', dealError, {
                                userPhone,
                                dealId,
                                source: 'WhatsAppController > /join',
                            });
                            responseMessage = '❌ Deal not found or not active.';
                            if (isTestMode) {
                                return res.status(200).json({
                                    success: false,
                                    response: responseMessage,
                                    debug: {
                                        error: 'Deal not found',
                                        dealId,
                                        dealError
                                    }
                                });
                            }
                            await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                            return res.sendStatus(200);
                        }
                        if (deal.current_participants >= deal.max_participants) {
                            logger_1.logger.info('Deal is full', { userPhone, dealId, participants: deal.current_participants });
                            responseMessage = '❌ Sorry, this deal is full! Check /deals for other offers.';
                            if (isTestMode) {
                                return res.status(200).json({
                                    success: false,
                                    response: responseMessage,
                                    debug: {
                                        error: 'Deal is full',
                                        currentParticipants: deal.current_participants,
                                        maxParticipants: deal.max_participants
                                    }
                                });
                            }
                            await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                            return res.sendStatus(200);
                        }
                        console.log('👥 Checking if user already joined...');
                        const { data: existing } = await supabaseClient_1.supabase
                            .from('participants')
                            .select('id')
                            .eq('deal_id', dealId)
                            .eq('phone_number', userPhone);
                        if (existing && existing.length > 0) {
                            console.log('ℹ️ User already joined this deal');
                            responseMessage = `ℹ️ You're already joined the ${deal.product_name} deal!`;
                            if (isTestMode) {
                                return res.status(200).json({
                                    success: false,
                                    response: responseMessage,
                                    debug: {
                                        error: 'Already joined',
                                        dealName: deal.product_name
                                    }
                                });
                            }
                            await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                            return res.sendStatus(200);
                        }
                        console.log('➕ Adding participant to deal...');
                        const participantData = {
                            deal_id: dealId,
                            phone_number: userPhone,
                            quantity: 1,
                            payment_status: 'pending',
                            amount_paid: deal.group_price,
                        };
                        const { error: insertError } = await supabaseClient_1.supabase
                            .from('participants')
                            .insert(participantData);
                        if (insertError) {
                            console.error('💥 Failed to join deal:', insertError);
                            responseMessage = "❌ Failed to join deal. Please try again.";
                            if (isTestMode) {
                                return res.status(200).json({
                                    success: false,
                                    response: responseMessage,
                                    debug: {
                                        error: 'Insert failed',
                                        insertError
                                    }
                                });
                            }
                            await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                            return res.sendStatus(200);
                        }
                        console.log('📊 Updating participant count...');
                        const { error: updateError } = await supabaseClient_1.supabase
                            .from('deals')
                            .update({
                            current_participants: deal.current_participants + 1,
                            updated_at: new Date().toISOString()
                        })
                            .eq('id', dealId);
                        if (updateError) {
                            console.error('⚠️ Failed to update participant count:', updateError);
                            logger_1.logger.error('Failed to update participant count', updateError, {
                                userPhone,
                                dealId,
                                source: 'WhatsAppController > /join',
                            });
                        }
                        const newCount = deal.current_participants + 1;
                        responseMessage = `🎉 Successfully joined ${deal.product_name}!\n💰 Price: ₹${deal.group_price}\n👥 Participants: ${newCount}/${deal.max_participants}`;
                        if (isTestMode) {
                            return res.status(200).json({
                                success: true,
                                response: responseMessage,
                                debug: {
                                    originalMessage: Body,
                                    processedMessage: command,
                                    phoneNumber: userPhone,
                                    dealId,
                                    dealName: deal.product_name,
                                    newParticipantCount: newCount
                                }
                            });
                        }
                        await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                        console.log('✅ User joined deal successfully:', { user: userPhone, deal: deal.product_name });
                        logger_1.logger.info('User successfully joined deal', { userPhone, dealId, dealTitle: deal.product_name });
                        return res.sendStatus(200);
                    }
                    catch (error) {
                        console.error('💥 Join deal error:', error);
                        logger_1.logger.error('Unexpected error in join command', error, { userPhone, dealIdentifier });
                        responseMessage = "❌ Something went wrong. Please try again.";
                        if (isTestMode) {
                            return res.status(200).json({
                                success: false,
                                response: responseMessage,
                                debug: {
                                    error: 'Unexpected error',
                                    details: error instanceof Error ? error.message : 'Unknown error'
                                }
                            });
                        }
                        await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                        return res.sendStatus(200);
                    }
                }
                if (command === '/mydeals') {
                    logger_1.logger.info('User requesting their deals', { userPhone });
                    const { data: joined, error } = await supabaseClient_1.supabase
                        .from('participants')
                        .select(`
              quantity,
              amount_paid,
              payment_status,
              joined_at,
              deal:deals(
                product_name,
                status,
                group_price,
                current_participants,
                min_participants
              )
            `)
                        .eq('phone_number', userPhone)
                        .order('joined_at', { ascending: false });
                    if (error) {
                        logger_1.logger.error('Failed to fetch user deals', error, {
                            userPhone,
                            source: 'WhatsAppController > /mydeals',
                        });
                        responseMessage = '❌ Error fetching your deals.';
                    }
                    else if (!joined?.length) {
                        logger_1.logger.info('User has no joined deals', { userPhone });
                        responseMessage = '📭 You haven\'t joined any deals yet! 🛍️\n\nUse /deals to see available offers.';
                    }
                    else {
                        logger_1.logger.info('User deals found', { userPhone, dealCount: joined.length });
                        responseMessage = '📋 *Your Deals* 📋\n\n';
                        joined.forEach((participant, index) => {
                            const deal = participant.deal;
                            responseMessage += `*${index + 1}. ${deal.product_name}*\n`;
                            responseMessage += `💰 Your price: ₹${participant.amount_paid}\n`;
                            responseMessage += `📊 Status: ${deal.status}\n`;
                            responseMessage += `👥 ${deal.current_participants}/${deal.min_participants} joined\n`;
                            responseMessage += `💳 Payment: ${participant.payment_status}\n\n`;
                        });
                    }
                    if (isTestMode) {
                        return res.status(200).json({
                            success: true,
                            response: responseMessage,
                            debug: {
                                originalMessage: Body,
                                processedMessage: command,
                                phoneNumber: userPhone,
                                dealCount: joined?.length || 0
                            }
                        });
                    }
                    await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                    logger_1.logger.info('User deals list sent successfully', { userPhone, dealCount: joined?.length || 0 });
                    return res.sendStatus(200);
                }
                logger_1.logger.info('Unknown command received', { userPhone, command });
                responseMessage = `🤖 Unknown command. Type /help for options\n\nAvailable commands:\n/deals - View active deals\n/mydeals - Your deals\n/join [number] - Join a deal\n/help - Show help`;
                if (isTestMode) {
                    return res.status(200).json({
                        success: true,
                        response: responseMessage,
                        debug: {
                            originalMessage: Body,
                            processedMessage: command,
                            phoneNumber: userPhone,
                            note: 'Unknown command fallback'
                        }
                    });
                }
                await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                return res.sendStatus(200);
            }
            catch (commandError) {
                console.error('💥 Command Error:', commandError);
                responseMessage = '❌ Command failed. Please try again.';
                if (isTestMode) {
                    return res.status(200).json({
                        success: false,
                        response: responseMessage,
                        debug: {
                            error: 'Command processing failed',
                            details: commandError instanceof Error ? commandError.message : 'Unknown command error'
                        }
                    });
                }
                await twilioService_1.twilioService.sendMessage(userPhone, responseMessage);
                return res.sendStatus(200);
            }
        }
        catch (err) {
            console.log('🎯 === WEBHOOK DEBUG END ===');
            console.error('💥 MAIN WEBHOOK ERROR:', err);
            console.error('💥 Stack:', err instanceof Error ? err.stack : 'No stack');
            console.error('💥 Request details:', {
                method: req.method,
                url: req.url,
                headers: req.headers,
                body: req.body
            });
            logger_1.logger.error('WhatsApp webhook error', err, {
                userPhone: req.body?.From,
                command: req.body?.Body,
                source: 'WhatsAppController > handleWebhook',
                code: err?.code,
                message: err?.message,
            });
            return res.status(500).json({
                error: 'Internal Server Error',
                message: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
}
exports.WhatsAppController = WhatsAppController;
exports.handleWebhook = new WhatsAppController().handleWebhook.bind(new WhatsAppController());
//# sourceMappingURL=whatsappController.js.map