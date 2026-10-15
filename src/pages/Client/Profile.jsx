import React from 'react';
import { useMe } from '../../lib/session';
import { Head, Page, Pill } from '../../components/kg/ui';
import { ProfileForm } from '../../components/kg/Forms';

const Profile = () => {
  const me = useMe();
  const { user, profile, client, phone } = me;
  const rating = client.rating_count ? (client.rating_sum / client.rating_count).toFixed(1) : 'no ratings yet';
  return (
    <Page>
      <Head title="Profile" sub={`${client.org_name} · ★ ${rating}`}>{client.verified ? <Pill tone="good">Verified</Pill> : <Pill tone="warn">Verification pending</Pill>}</Head>
      <div className="card stack"><h3>Contact person</h3>
        <ProfileForm uid={user.id} name={profile.full_name} area={profile.area ?? ''} phone={phone ?? ''} worker={false} onDone={me.refresh} />
        <p className="note">Approved workers see this name and number for the jobs they are booked on.</p>
      </div>
    </Page>
  );
};

export default Profile;
