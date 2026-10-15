import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useMe } from '../../lib/session';
import { Loading, Page } from '../../components/kg/ui';

// The Aadhaar provider sends the worker back here; the server checks the result.
const KycCallback = () => {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const me = useMe();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const r = await api('/api/kyc/finish', { ref: sp.get('ref') });
      await me.refresh();
      navigate(r.ok ? '/worker/dashboard' : '/worker/profile?kyc=failed#kyc', { replace: true });
    })();
  }, [sp, navigate, me]);

  return <Page><Loading /></Page>;
};

export default KycCallback;
