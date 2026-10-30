import { useComplaints as useComplaintsFromContext } from '../context/ComplaintContext';

export const useComplaints = () => {
  return useComplaintsFromContext();
};

export default useComplaints;

