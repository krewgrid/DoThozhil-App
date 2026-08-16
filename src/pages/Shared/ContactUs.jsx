import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ContactUsView } from '../../components/ui/contact-us-view';

const ContactUs = () => {
  const navigate = useNavigate();

  return (
    <ContactUsView onBack={() => navigate(-1)} />
  );
};

export default ContactUs;
