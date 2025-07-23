import React from 'react';
import { Brain, Calculator, Crown, Users, Shield, Zap, ArrowRight, Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingPage() {
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
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with reliable uptime and data protection'
    },
    {
      icon: Users,
      title: 'Professional Support',
      description: 'Dedicated support team to help you maximize your success'
    },
    {
      icon: Zap,
      title: 'Fast & Efficient',
      description: 'Lightning-fast tools designed for professional use'
    }
  ];

  const pricingFeatures = [
    'AI Prompt Generator with image analysis',
    'Real-time Arbitrage Calculator',
    'Exclusive VIP betting tips',
    'Professional dashboard access',
    'Priority customer support',
    'Mobile-optimized experience'
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-green-600/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 bg-clip-text text-transparent mb-6 leading-tight">
                ProSoft Hub
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full"></div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Professional software platform with AI-powered tools, arbitrage calculations, and exclusive VIP insights. 
              Built for professionals who demand excellence.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.a
                href="#signup"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-3 group"
              >
                <span>Start 3-Day Free Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              
              <motion.a
                href="https://whop.com/ai-sports-betting-tips-premium/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-gray-600 hover:border-blue-500 text-gray-300 hover:text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 backdrop-blur-sm"
              >
                Subscribe via Whop - $99/month
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Powerful Professional Tools</h2>
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
                whileHover={{ y: -5 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 group cursor-pointer block"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Why Choose ProSoft Hub?</h2>
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
                  className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20"
                >
                  <benefit.icon className="h-12 w-12 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </motion.div>
                <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-blue-400 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-lg">{benefit.description}</p>
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
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              Get access to all professional tools with a single subscription
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-12 border border-gray-700 shadow-2xl"
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-4">Professional Access</h3>
              <div className="flex items-center justify-center mb-4">
                <span className="text-5xl font-bold text-white">$99</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-gray-400">Full access to all professional tools</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {pricingFeatures.map((feature, index) => (
                <motion.div
                  key={feature}
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

            <motion.a
              href="https://whop.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-4 px-12 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl inline-block text-lg"
            >
              Subscribe Now - $99/month
            </motion.a>
          </motion.div>
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
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Trusted by Professionals</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See what our users say about ProSoft Hub
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Johnson",
                role: "Professional Trader",
                content: "The arbitrage calculator has revolutionized my trading strategy. The real-time odds integration is incredibly accurate.",
                rating: 5
              },
              {
                name: "Sarah Chen",
                role: "Content Creator",
                content: "The AI prompt generator is a game-changer. It saves me hours of work and produces exceptional results every time.",
                rating: 5
              },
              {
                name: "Mike Rodriguez",
                role: "Sports Analyst",
                content: "The VIP tips feature provides insights that I can't find anywhere else. The quality is consistently outstanding.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-gray-400 text-sm">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-r from-blue-600/20 to-green-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Elevate Your Professional Game?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Join thousands of professionals who trust ProSoft Hub for their success. Premium access for just $99/month.
            </p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.a
                href="#signup"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-gray-900 font-semibold py-4 px-12 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Start Your Free Trial
              </motion.a>
              <motion.a
                href="https://whop.com"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white font-semibold py-4 px-12 rounded-xl transition-all duration-300 hover:bg-white hover:text-gray-900 text-lg"
              >
                Subscribe Now - $99/month
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}