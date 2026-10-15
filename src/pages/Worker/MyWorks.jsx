import React from 'react';
import { useLoad } from '../../lib/api';
import { useMe } from '../../lib/session';
import { Body, Head } from '../../components/kg/ui';
import { WorksTable } from '../../components/kg/Lists';
import { loadMyWorks } from './Dashboard';

const MyWorks = () => {
  const { worker } = useMe();
  const q = useLoad(() => loadMyWorks(worker.id), [worker.id]);
  return (
    <Body q={q}>{({ rows, cname }) => <>
      <Head title="My works" sub="Every application and booking. Open one to check in, check out, chat or rate." />
      <WorksTable rows={rows} cname={cname} />
    </>}</Body>
  );
};

export default MyWorks;
