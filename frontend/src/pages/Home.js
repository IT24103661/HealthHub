import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserMd, FaUserNurse, FaClipboardList, FaChartLine, FaCalendarAlt, FaStethoscope, FaHospital, FaAmbulance, FaPills, FaUserFriends, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaHeartbeat } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

const FeatureCard = ({ icon, title, description, link, delay }) => (
  <motion.div 
    className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
    variants={itemVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    transition={{ delay }}
  >
    <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-2xl mb-6">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
    <Link 
      to={link} 
      className="text-blue-600 font-semibold hover:text-blue-700 transition-colors inline-flex items-center group"
    >
      Learn more
      <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </Link>
  </motion.div>
);

const TestimonialCard = ({ name, role, content, avatar }) => (
  <div className="bg-white p-8 rounded-2xl shadow-lg">
    <div className="flex items-center mb-4">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
        {avatar}
      </div>
      <div className="ml-4">
        <h4 className="font-semibold text-gray-900">{name}</h4>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </div>
    <p className="text-gray-600 italic">"{content}"</p>
  </div>
);

const Home = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <FaUserMd className="w-6 h-6" />,
      title: 'Expert Medical Team',
      description: 'Access to board-certified physicians and specialists with years of experience in their respective fields.',
      link: '/login',
      delay: 0.1
    },
    {
      icon: <FaUserNurse className="w-6 h-6" />,
      title: 'Nutritional Counseling',
      description: 'Personalized diet plans and nutritional guidance from our team of certified dietitians.',
      link: '/login',
      delay: 0.2
    },
    {
      icon: <FaClipboardList className="w-6 h-6" />,
      title: 'Digital Health Records',
      description: 'Secure, centralized access to your complete medical history and health information.',
      link: '/login',
      delay: 0.3
    },
    {
      icon: <FaChartLine className="w-6 h-6" />,
      title: 'Health Analytics',
      description: 'Comprehensive tracking and analysis of your health metrics for better insights.',
      link: '/login',
      delay: 0.4
    },
    {
      icon: <FaCalendarAlt className="w-6 h-6" />,
      title: 'Easy Scheduling',
      description: 'Book, reschedule, or cancel appointments with our easy-to-use online system.',
      link: '/login',
      delay: 0.5
    },
    {
      icon: <FaStethoscope className="w-6 h-6" />,
      title: '24/7 Support',
      description: 'Round-the-clock assistance for all your healthcare needs and emergencies.',
      link: '/login',
      delay: 0.6
    }
  ];

  const services = [
    {
      title: 'Primary Care',
      description: 'Comprehensive healthcare for patients of all ages.',
      icon: <FaStethoscope className="w-8 h-8 text-blue-600" />
    },
    {
      title: 'Specialty Care',
      description: 'Access to specialists in various medical fields.',
      icon: <FaHospital className="w-8 h-8 text-blue-600" />
    },
    {
      title: 'Wellness Programs',
      description: 'Preventive care and health maintenance programs.',
      icon: <FaHeartbeat className="w-8 h-8 text-blue-600" />
    },
    {
      title: 'Pharmacy Services',
      description: 'Prescription management and medication delivery.',
      icon: <FaPills className="w-8 h-8 text-blue-600" />
    }
  ];

  const testimonials = [
    {
      name: 'John D.',
      role: 'Patient',
      content: 'The care I received was exceptional. The doctors were knowledgeable and took the time to listen to my concerns.',
      avatar: 'JD'
    },
    {
      name: 'Sarah M.',
      role: 'Patient',
      content: 'The online appointment system is so convenient. I was able to see a doctor without leaving my home!',
      avatar: 'SM'
    },
    {
      name: 'Robert K.',
      role: 'Patient',
      content: 'The staff is friendly and professional. I always feel well taken care of during my visits.',
      avatar: 'RK'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className={`text-2xl font-bold ${isScrolled ? 'text-blue-600' : 'text-white'}`}>HealthHub</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link 
                  to="/" 
                  onClick={(e) => {
                    if (window.location.pathname === '/') {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }} 
                  className={`px-3 py-2 text-sm font-medium ${isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-blue-100'}`}
                >
                  Home
                </Link>
                <a href="#services" className={`px-3 py-2 text-sm font-medium ${isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-blue-100'}`}>Services</a>
                <a href="#about" className={`px-3 py-2 text-sm font-medium ${isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-blue-100'}`}>About</a>
                <a href="#contact" className={`px-3 py-2 text-sm font-medium ${isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-blue-100'}`}>Contact</a>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <Link
                  to="/signup"
                  className={`px-4 py-2 rounded-md text-sm font-medium ${isScrolled ? 'text-blue-600 hover:bg-blue-50' : 'text-white hover:bg-blue-700'} mr-3`}
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Login
                </Link>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <svg className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-white shadow-lg rounded-lg mx-4 mt-2 py-2`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">Home</Link>
            <a href="#services" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">Services</a>
            <a href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">About</a>
            <a href="#contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">Contact</a>
            <div className="border-t border-gray-200 mt-2 pt-2">
              <Link to="/login" className="block w-full text-center px-4 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md">
                Login
              </Link>
              <Link to="/signup" className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md mt-2">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMCAzOGg0MFYyMEgwdjE4em0wLTIwaDQwVjBIMHYxOHoiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="mb-10 lg:mb-0">
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Your Health, <span className="text-blue-200">Our Priority</span>
              </motion.h1>
              <motion.p 
                className="text-xl text-blue-100 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Experience healthcare reimagined with our comprehensive digital platform. Connect with top medical professionals, manage your health records, and receive personalized care—all in one place.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg shadow-lg hover:bg-blue-50 transition-colors text-center"
                >
                  Get Started
                </Link>
                <a
                  href="#services"
                  className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-center"
                >
                  Learn More
                </a>
              </motion.div>
              <motion.div 
                className="mt-8 flex items-center space-x-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="w-10 h-10 rounded-full border-2 border-white bg-blue-500"></div>
                  ))}
                </div>
                <div className="text-sm text-blue-100">
                  <div className="font-semibold">Trusted by 10,000+ patients</div>
                  <div>Rated 4.9/5 by our community</div>
                </div>
              </motion.div>
            </div>
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-1">
                <img
                  src="https://images.unsplash.com/photo-1505751172876-faee399c84df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                  alt="Doctor with patient"
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                  <div className="text-white font-medium">Dr. Sarah Johnson</div>
                  <div className="text-blue-200 text-sm">Cardiologist, 12+ years experience</div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg hidden lg:block">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                    <FaCalendarAlt className="w-6 h-6" />
                  </div>
                  <div className="ml-3">
                    <div className="text-xs text-gray-500">Next Available</div>
                    <div className="font-semibold">Today, 4:30 PM</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-600 to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '50+', label: 'Expert Doctors', icon: <FaUserMd /> },
              { number: '10K+', label: 'Patients Served', icon: <FaUserFriends /> },
              { number: '24/7', label: 'Support', icon: <FaAmbulance /> },
              { number: '99%', label: 'Satisfaction', icon: <FaHeartbeat /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
                <div className="mt-3 text-blue-500">{stat.icon}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Our Services</span>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Everything you need to take control of your health and wellness journey.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                link={feature.link}
                delay={feature.delay}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <motion.div 
              className="mb-10 lg:mb-0"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">About Us</span>
              <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Committed to Your Health and Well-being
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                At HealthHub, we believe that everyone deserves access to high-quality healthcare. Our mission is to make healthcare more accessible, convenient, and effective through innovative technology and compassionate care.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg text-blue-600">
                    <FaUserMd className="w-5 h-5" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Expert Medical Team</h3>
                    <p className="mt-1 text-gray-600">Board-certified doctors and healthcare professionals dedicated to your well-being.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg text-blue-600">
                    <FaClipboardList className="w-5 h-5" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Patient-Centered Care</h3>
                    <p className="mt-1 text-gray-600">Personalized treatment plans tailored to your unique health needs and goals.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg text-blue-600">
                    <FaChartLine className="w-5 h-5" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Innovative Technology</h3>
                    <p className="mt-1 text-gray-600">Cutting-edge tools and platforms for seamless healthcare management.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1504439468489-c8920d796a29?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
                  alt="Medical team"
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-lg hidden lg:block w-2/3">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                    <FaUserFriends className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <div className="text-xs text-gray-500">Our Team</div>
                    <div className="font-semibold">Committed to Excellence in Healthcare</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What Our Patients Say
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Hear from people who have experienced our healthcare services.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <TestimonialCard {...testimonial} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="relative bg-blue-700 overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-10"
            src="https://images.unsplash.com/photo-1504813184591-01572f98c85f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
            alt="Doctor with stethoscope"
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-3xl font-extrabold text-white sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="block">Ready to take control of your health?</span>
          </motion.h2>
          <motion.p 
            className="mt-4 max-w-2xl text-xl text-blue-100 mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Join thousands of patients who trust HealthHub for their healthcare needs.
          </motion.p>
          <motion.div 
            className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg shadow-lg hover:bg-blue-50 transition-colors text-center"
            >
              Sign up for free
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-center"
            >
              Contact us
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-white text-lg font-semibold mb-6">HealthHub</h3>
              <p className="text-gray-400 mb-6">Your trusted partner in healthcare, providing comprehensive medical services with compassion and excellence.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <FaFacebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <FaTwitter className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <FaInstagram className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <FaLinkedin className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><a href="#services" className="text-gray-400 hover:text-white transition-colors">Services</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/signup" className="text-gray-400 hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-6">Services</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Primary Care</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Specialty Care</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Wellness Programs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pharmacy Services</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Telemedicine</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Emergency Care</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-6">Contact Us</h3>
              <address className="not-italic">
                <p className="text-gray-400">123 Healthcare Ave</p>
                <p className="text-gray-400">Medical District, City 12345</p>
                <p className="mt-2 text-gray-400">
                  <a href="tel:+1234567890" className="hover:text-white transition-colors">(123) 456-7890</a>
                </p>
                <p className="text-gray-400">
                  <a href="mailto:info@healthhub.com" className="hover:text-white transition-colors">info@healthhub.com</a>
                </p>
              </address>
              <div className="mt-6">
                <h4 className="text-white font-medium mb-2">Opening Hours</h4>
                <p className="text-gray-400 text-sm">Monday - Friday: 8:00 AM - 8:00 PM</p>
                <p className="text-gray-400 text-sm">Saturday: 9:00 AM - 5:00 PM</p>
                <p className="text-gray-400 text-sm">Sunday: Closed</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-gray-400 text-sm text-center">
              &copy; {new Date().getFullYear()} HealthHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
