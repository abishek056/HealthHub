import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STORAGE_KEY = 'healthhub_selected_hospital_id';

export function useActiveHospital() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isSuperAdmin = user?.role === 'super_admin';

  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  // Determine initial active hospital ID
  const getInitialId = () => {
    if (!isSuperAdmin && user?.hospital_id) {
      return Number(user.hospital_id);
    }
    const queryId = searchParams.get('hospital_id');
    if (queryId) return Number(queryId);

    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) return Number(storedId);

    return user?.hospital_id ? Number(user.hospital_id) : 1;
  };

  const [hospitalId, setHospitalIdState] = useState(getInitialId);

  // Keep hospitalId synced with URL param or user
  useEffect(() => {
    if (!isSuperAdmin && user?.hospital_id) {
      setHospitalIdState(Number(user.hospital_id));
      return;
    }

    const queryId = searchParams.get('hospital_id');
    if (queryId) {
      const numId = Number(queryId);
      setHospitalIdState(numId);
      localStorage.setItem(STORAGE_KEY, numId);
    }
  }, [searchParams, user, isSuperAdmin]);

  // If super admin, fetch all hospitals for switcher dropdown
  useEffect(() => {
    if (!isSuperAdmin) return;

    let isMounted = true;
    setLoadingHospitals(true);
    api.get('/hospitals')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setHospitals(list);

        const queryId = searchParams.get('hospital_id');
        const storedId = localStorage.getItem(STORAGE_KEY);

        if (!queryId && !storedId && list.length > 0) {
          const firstId = list[0].id;
          setHospitalIdState(firstId);
          localStorage.setItem(STORAGE_KEY, firstId);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch hospital list for super admin:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingHospitals(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin, searchParams]);

  // Function to switch hospital
  const changeHospital = useCallback((newId) => {
    const numId = Number(newId);
    setHospitalIdState(numId);
    localStorage.setItem(STORAGE_KEY, numId);

    const newParams = new URLSearchParams(searchParams);
    newParams.set('hospital_id', numId);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const currentHospital = hospitals.find((h) => Number(h.id) === Number(hospitalId));

  return {
    hospitalId: Number(hospitalId) || (user?.hospital_id ? Number(user.hospital_id) : 1),
    currentHospital,
    hospitals,
    loadingHospitals,
    isSuperAdmin,
    changeHospital,
  };
}
