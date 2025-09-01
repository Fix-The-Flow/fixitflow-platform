import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  Search, 
  BookOpen, 
  Users, 
  Star, 
  ArrowRight,
  Wrench,
  Home,
  Smartphone,
  Heart,
  PawPrint,
  Zap
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useMascot } from '../contexts/MascotContext';

const HomePage = () => {
  const { showContextualTip } = useMascot();

  // Show welcome tip when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      showContextualTip('home');
    }, 1000);
    return () => clearTimeout(timer);
  }, [showContextualTip]);

  // Fetch homepage data
  const { data: categories } = useQuery('categories', async () => {
    const response = await axios.get('/api/categories');
    return response.data.categories;
  });

  const { data: featuredGuides } = useQuery('featuredGuides', async () => {
    const response = await axios.get('/api/guides?sort=popular&limit=6');
    return response.data.guides;
  });

  const { data: featuredEbooks } = useQuery('featuredEbooks', async () => {
    const response = await axios.get('/api/ebooks/featured/list');
    return response.data.ebooks;
  });

  const categoryIcons = {
    'DIY': Home,
    'Tech': Smartphone,
    'Self-Care': Heart,
    'Pets': PawPrint,
    'Home Repair': Wrench,
    'default': Zap
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <>
      <Helmet>
        <title>FixItFlow - Your Friendly Troubleshooting Companion</title>
        <meta name="description" content="Solve everyday problems with our playful, step-by-step guides covering DIY, tech, self-care, pets, home repair, and more. Expert eBooks and AI-powered assistance included." />
        <meta name="keywords" content="troubleshooting, guides, DIY, tech support, home repair, self-care, pet care, eBooks" />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="gradient-bg text-white py-20 lg:py-32">
          <motion.div 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl font-bold font-display mb-6"
            >
              Fix It Like a Pro
              <br />
              <span className="text-primary-200">With a Smile</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto"
            >
              Your friendly troubleshooting companion for everyday problems. 
              Step-by-step guides, expert eBooks, and AI-powered assistance - all with a playful twist!
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                to="/guides" 
                className="btn-primary bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-4"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Guides
              </Link>
              <Link 
                to="/ebooks" 
                className="btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Explore eBooks
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl font-bold">1000+</div>
                <div className="text-primary-200">Problem-Solving Guides</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-primary-200">Expert eBooks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">10k+</div>
                <div className="text-primary-200">Happy Users</div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Categories Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Can We Help You Fix?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                From tech troubles to home repairs, we've got guides for everything
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {categories?.slice(0, 6).map((category, index) => {
                const IconComponent = categoryIcons[category.name] || categoryIcons.default;
                return (
                  <motion.div key={category._id} variants={itemVariants}>
                    <Link 
                      to={`/categories/${category.slug}`}
                      className="card card-hover p-6 block group"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <IconComponent 
                            className="w-6 h-6" 
                            style={{ color: category.color }}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {category.guideCount} guides
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {category.description}
                      </p>
                      <div className="flex items-center text-primary-600 text-sm font-medium">
                        Explore guides
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="text-center mt-12">
              <Link to="/categories" className="btn-outline">
                View All Categories
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Guides */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Most Popular Guides
              </h2>
              <p className="text-xl text-gray-600">
                Join thousands who've successfully solved these problems
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {featuredGuides?.map((guide, index) => (
                <motion.div key={guide._id} variants={itemVariants}>
                  <Link to={`/guides/${guide.slug}`} className="card card-hover block">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium severity-${guide.severity}`}
                        >
                          {guide.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium difficulty-${guide.difficulty}`}>
                          {guide.difficulty}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                        {guide.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {guide.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{guide.estimatedTime}</span>
                        <div className="flex items-center space-x-3">
                          <span>{guide.views} views</span>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span>{guide.rating.average || 'New'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center mt-12">
              <Link to="/guides" className="btn-primary">
                View All Guides
              </Link>
            </div>
          </div>
        </section>

        {/* Featured eBooks */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Comprehensive eBook Library
              </h2>
              <p className="text-xl text-gray-600">
                Deep-dive into topics with our expertly crafted eBooks
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {featuredEbooks?.map((ebook, index) => (
                <motion.div key={ebook._id} variants={itemVariants}>
                  <Link to={`/ebooks/${ebook.slug}`} className="card card-hover block">
                    <div className="aspect-w-3 aspect-h-4 bg-gradient-to-br from-primary-100 to-primary-200">
                      {ebook.coverImage ? (
                        <img 
                          src={ebook.coverImage} 
                          alt={ebook.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-primary-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {ebook.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {ebook.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary-600">
                          ${ebook.price}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span>{ebook.rating.average || 'New'}</span>
                          <span className="ml-2">({ebook.sales.count} sold)</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center mt-12">
              <Link to="/ebooks" className="btn-primary">
                Browse eBook Library
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 gradient-bg text-white">
          <motion.div 
            className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Fixing?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join our community of problem-solvers and never get stuck again!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/register" 
                className="btn-primary bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-4"
              >
                <Users className="w-5 h-5 mr-2" />
                Join Free Today
              </Link>
              <Link 
                to="/guides" 
                className="btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4"
              >
                Start Browsing
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
