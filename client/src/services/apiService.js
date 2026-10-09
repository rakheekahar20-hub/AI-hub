import axios from 'axios';

const API_URL = '/api/features';

export const fetchFeatures = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createFeature = async (featureData) => {
  const response = await axios.post(API_URL, featureData);
  return response.data;
};