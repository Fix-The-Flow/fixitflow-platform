import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMascot } from '../contexts/MascotContext';

const EbooksPage = () => {
  const { showContextualTip } = useMascot();

  useEffect(() => {
    const timer = setTimeout(() => {
      showContextualTip('ebooks');
    }, 1500);
    return () => clearTimeout(timer);
  }, [showContextualTip]);

  return (
    <>
      <Helmet>
        <title>eBook Library - FixItFlow</title>
        <meta name="description" content="Browse our collection of comprehensive eBooks covering troubleshooting, DIY projects, and more." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">eBook Library</h1>
          <p className="text-gray-600 mb-8">Coming soon - Browse and purchase our comprehensive eBook collection!</p>
          <div className="text-6xl mb-4">📚</div>
        </div>
      </div>
    </>
  );
};

export default EbooksPage;
