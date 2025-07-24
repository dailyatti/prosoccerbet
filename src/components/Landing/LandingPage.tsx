import React from 'react';
import { Brain, Calculator, Crown, Users, Shield, Zap, ArrowRight, Star, CheckCircle, Euro, Calendar, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { STRIPE_PRODUCTS, getTrialInfo } from '../../stripe-config';
import { formatCurrency } from '../../lib/stripe';

export function LandingPage() {
  const product = STRIPE_PRODUCTS.advanced_arbitrage_ai_prompts;
  const trialInfo = getTrialInfo();

  const features = [
    {
      icon: Brain,
      title: 'AI Prompt Generator',
      description: 'Generate professional AI prompts from text or images using advanced AI technology',
      color: 'from-purple-500 to-pink-500',
      link: 'https://eng-prompt-elemz.netlify.app/'
    },
    {
      icon: Calculator,
      title: 'Arbitrage Calculator',
      description: 'Find profitable arbitrage opportunities across different bookmakers with real-time odds',
      color: 'from-green-500 to-teal-500',
      link: 'https://prismatic-meringue-16ade7.netlify.app/'
    },
    {
      icon: Crown,
      title: 'VIP Tips',
      description: 'Access exclusive betting tips and professional insights from our expert team',
      color: 'from-yellow-500 to-orange-500',
      link: '#vip-tips'
    }
  ];

  const benefits = [
    {
      icon: Target,
      title: 'Precision Tools',
      description: 'Professional-grade calculators and AI tools designed for serious bettors',
      stats: '99.2% Accuracy'
    },
    {
      icon: TrendingUp,
      title: 'Profit Maximization',
      description: 'Maximize your profits with low-risk arbitrage opportunities and expert insights',
      stats: 'Average 15% ROI'
    },
    {
      icon: Shield,
      title: 'Professional Support',
      description: 'Dedicated support team and regular updates to keep you ahead of the game',
      stats: '24/7 Support'
    }
  ];

  const testimonials = [
    {
      name: "Marcus Weber",
      role: "Professional Trader",
      content: "The arbitrage calculator has revolutionized my betting strategy. I've increased my profits by 40% while reducing risk significantly.",
      rating: 5,
      profit: "+€2,840",
      avatar: "M"
    },
    {
      name: "Sarah Hoffmann",
      role: "Data Analyst",
      content: "The AI prompt generator is incredible. It creates prompts that would take me hours to develop in just seconds.",
      rating: 5,
      profit: "+€1,950",
      avatar: "S"
    },
    {
      name: "David Chen",
      role: "Sports Betting Expert",
      content: "VIP tips are consistently profitable. The analysis depth and accuracy is unmatched in the industry.",
      rating: 5,
      profit: "+€3,120",
      avatar: "D"
    }
  ];

  const stats = [
    { label: 'Active Users', value: '12,500+', icon: Users },
    { label: 'Monthly Profit Generated', value: '€180K+', icon: TrendingUp },
    { label: 'Success Rate', value: '94.7%', icon: Target },
    { label: 'Countries Served', value: '45+', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-green-600/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 via-green-400 to-blue-400 bg-clip-text text-transparent mb-8 leading-tight">
                ProSoft Hub
              </h1>
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                <Crown className="h-8 w-8 text-yellow-400" />
                <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-green-500 rounded-full"></div>
              </div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl md:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              {product.description}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.button
                onClick={() => {
                  const event = new CustomEvent('openStripeCheckout');
                  window.dispatchEvent(event);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-5 px-10 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center space-x-3 group text-lg"
              >
                <Star className="h-6 w-6 text-yellow-300" />
                <span>Start {trialInfo.duration}-Day Free Trial</span>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button
                onClick={() => {
                  const event = new CustomEvent('openStripeCheckout');
                  window.dispatchEvent(event);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-gray-600 hover:border-green-500 text-gray-300 hover:text-white font-bold py-5 px-10 rounded-xl transition-all duration-300 backdrop-blur-sm text-lg"
              >
                Subscribe - {formatCurrency(product.price, product.currency)}/{product.interval}
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center space-x-8 mt-12 text-gray-400"
            >
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-400" />
                <span>12,500+ Users</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">Professional Tools</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Access cutting-edge software tools designed for professionals who demand excellence and superior results
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.a
                key={feature.title}
                href={feature.link}
                target={feature.link.startsWith('http') ? "_blank" : "_self"}
                rel={feature.link.startsWith('http') ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 group cursor-pointer block relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 lg:py-32 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">Why Choose ProSoft Hub?</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Built for professionals who need reliable, fast, and secure software solutions that deliver results
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20 group-hover:border-blue-500/40 transition-all duration-300"
                >
                  <benefit.icon className="h-12 w-12 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </motion.div>
                <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-blue-400 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-lg mb-4">{benefit.description}</p>
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg px-4 py-2 inline-block">
                  <span className="text-green-400 font-semibold">{benefit.stats}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">Success Stories</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See what our professional users say about ProSoft Hub
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {testimonial.profit}
                </div>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed italic">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 lg:py-32 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">Simple, Professional Pricing</h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              Get access to all professional tools with a single subscription
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-12 border-2 border-green-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold px-6 py-2 rounded-full shadow-lg">
                🎯 MOST POPULAR
              </span>
            </div>

            <div className="text-center mb-8 pt-4">
              <h3 className="text-3xl font-bold text-white mb-6">{product.name}</h3>
              <div className="flex items-center justify-center mb-6">
                <Euro className="h-8 w-8 text-green-400 mr-2" />
                <span className="text-6xl font-bold text-white">{product.price.toFixed(0)}</span>
                <div className="ml-3 text-left">
                  <div className="text-gray-400">EUR</div>
                  <div className="text-gray-400">/{product.interval}</div>
                </div>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {product.features.map((feature, index) => (
                <motion.div
                  key={feature}
                 onClick={!feature.link.startsWith('http') ? (e) => {
                   e.preventDefault();
                   window.location.hash = feature.link;
                 } : undefined}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-3"
                >
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={() => {
                const event = new CustomEvent('openStripeCheckout');
                window.dispatchEvent(event);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-5 px-12 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl text-xl"
            >
              Start {trialInfo.duration}-Day Free Trial
            </motion.button>

            <p className="text-gray-400 text-sm mt-4">
              {trialInfo.duration} days free, then {formatCurrency(product.price, product.currency)} per {product.interval}. Cancel anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 lg:py-32 bg-gradient-to-r from-blue-600/20 to-green-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Win Like a Pro?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join 12,500+ professionals who trust ProSoft Hub for their success. Start your {trialInfo.duration}-day free trial today.
            </p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.button
                onClick={() => {
                  const event = new CustomEvent('openStripeCheckout');
                  window.dispatchEvent(event);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-gray-900 font-bold py-5 px-12 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl text-xl inline-flex items-center space-x-3"
              >
                <Crown className="h-6 w-6 text-yellow-500" />
                <span>Start Free Trial Now</span>
                <ArrowRight className="h-6 w-6" />
              </motion.button>
              <p className="text-gray-400 mt-4">
                No credit card required • Full access • Cancel anytime
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}