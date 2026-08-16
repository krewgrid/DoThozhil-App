import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PostWorkView } from '../../components/ui/post-work-view';

const PostWork = () => {
  const navigate = useNavigate();

  return (
    <PostWorkView onBack={() => navigate(-1)} />
  );
};

export default PostWork;
