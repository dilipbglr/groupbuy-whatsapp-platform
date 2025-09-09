import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import ErrorMessage from '../components/ErrorMessage';
import { dealsApi, participantsApi } from '../services/api';

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deal, setDeal] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealRes, participantsRes] = await Promise.all([
          dealsApi.getDeal(id!),
          participantsApi.getDealParticipants(id!)
        ]);

        const dealData = await dealRes.json();
        const participantsData = await participantsRes.json();

        setDeal(dealData.data);
        setParticipants(participantsData.data);
      } catch (err: any) {
        console.error('Error fetching deal details:', err);
        setError('Failed to load deal details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading deal details...</div>
        </div>
      </Layout>
    );
  }

  if (error || !deal) {
    return (
      <Layout>
        <ErrorMessage message={error || 'Deal not found.'} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Deal Details</h1>
          <button
            className="text-blue-600 hover:underline"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Product</h2>
            <p className="text-gray-600">{deal.product_name}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800">Status</h2>
            <p className="text-gray-600 capitalize">{deal.status}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800">Participants</h2>
            <p className="text-gray-600">{deal.current_participants} / {deal.max_participants}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800">Price</h2>
            <p className="text-gray-600">₹{deal.group_price.toLocaleString()}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800">Created At</h2>
            <p className="text-gray-600">{new Date(deal.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Participants List</h2>
          {participants.length === 0 ? (
            <p className="text-gray-500">No participants yet.</p>
          ) : (
            <ul className="space-y-2">
              {participants.map((p, index) => (
                <li key={p.id || index} className="border-b pb-2">
                  {p.name || 'User'} — {p.phone_number}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DealDetail;
