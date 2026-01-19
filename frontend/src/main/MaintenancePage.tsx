import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Server, Database, Shield, Clock, Bell } from 'lucide-react';
import AiAnimation from '../assets/ai/ai-animation.svg';

interface MaintenancePageProps {
  message: string;
  estimatedEndTime?: string;
}

// Rotating AI background animation (matching AI pages pattern)
const AnimatedBackground = () => (
  <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20 pointer-events-none overflow-hidden">
    <motion.img
      src={AiAnimation}
      alt=""
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      className="w-[800px] h-[800px] min-w-[600px] min-h-[600px]"
    />
  </div>
);

// Floating particles for ambient movement
const FloatingParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-amber-500/30 rounded-full"
        style={{
          left: `${15 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3 + i * 0.5,
          repeat: Infinity,
          delay: i * 0.3,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

// Status indicator data
const statusItems = [
  { icon: Server, label: 'Systems', status: 'updating', color: 'text-blue-400' },
  { icon: Database, label: 'Database', status: 'optimizing', color: 'text-purple-400' },
  { icon: Shield, label: 'Security', status: 'checking', color: 'text-green-400' },
];

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
} as const;

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  message,
  estimatedEndTime
}) => {
  const formatEndTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Floating Particles */}
      <FloatingParticles />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl w-full text-center relative z-10"
      >
        {/* Breyus Logo */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <img src="/Logo.png" alt="Breyus" className="h-10 w-10" />
          <span className="text-2xl font-bold text-white">Breyus</span>
        </motion.div>

        {/* Enhanced Gear Icon with Glow */}
        <motion.div
          variants={itemVariants}
          className="mb-8 relative"
        >
          {/* Outer glow ring */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-28 h-28 rounded-full bg-amber-500/20 blur-xl" />
          </motion.div>

          {/* Rotating gear icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <Settings className="w-20 h-20 mx-auto text-amber-500" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold text-white mb-4"
        >
          Under Maintenance
        </motion.h1>

        {/* Message */}
        <motion.p
          variants={itemVariants}
          className="text-lg text-gray-300 mb-8 max-w-md mx-auto"
        >
          {message || "We're currently performing scheduled maintenance. We'll be back shortly."}
        </motion.p>

        {/* Status Indicators Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {statusItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4"
            >
              <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
              <p className="text-sm font-medium text-white">{item.label}</p>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                className="text-xs text-gray-400 mt-1"
              >
                {item.status}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>

        {/* Animated Progress Bar */}
        <motion.div
          variants={itemVariants}
          className="mb-8"
        >
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: ['20%', '80%', '20%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            />
          </div>
        </motion.div>

        {/* Estimated End Time with Glow */}
        {estimatedEndTime && (
          <motion.div
            variants={itemVariants}
            className="relative mb-8"
          >
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-3xl" />
            <div className="relative bg-gray-800/60 backdrop-blur-sm border border-amber-500/30 rounded-xl px-6 py-5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <p className="text-sm text-gray-400">Estimated completion</p>
              </div>
              <p className="text-lg text-amber-400 font-medium">
                {formatEndTime(estimatedEndTime)}
              </p>
            </div>
          </motion.div>
        )}

        {/* Info Cards Section */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          {/* Expected Duration Card */}
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-medium text-white">Expected Duration</p>
            </div>
            <p className="text-sm text-gray-400">
              Most maintenance windows last 15-30 minutes
            </p>
          </div>

          {/* Stay Updated Card */}
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-medium text-white">Stay Updated</p>
            </div>
            <p className="text-sm text-gray-400">
              This page auto-refreshes. You'll be redirected when we're back online.
            </p>
          </div>
        </motion.div>

        {/* Loading Animation Dots */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center gap-2 mb-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-3 h-3 bg-amber-500 rounded-full"
            />
          ))}
        </motion.div>

        {/* Footer with Contact Support */}
        <motion.div
          variants={itemVariants}
          className="pt-8 border-t border-gray-700/50"
        >
          <p className="text-gray-500 text-sm mb-2">
            Powered by{' '}
            <span className="text-white font-semibold">Breyus</span>
          </p>
          <p className="text-sm text-gray-500">
            Need urgent assistance?{' '}
            <a
              href="mailto:support@breyus.com"
              className="text-amber-500 hover:text-amber-400 transition-colors"
            >
              Contact Support
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
