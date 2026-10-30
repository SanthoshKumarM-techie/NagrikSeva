import { useAuth as useAuthFromContext } from '../context/AuthContext';

export const useAuth = () => {
  return useAuthFromContext();
};

export default useAuth;

