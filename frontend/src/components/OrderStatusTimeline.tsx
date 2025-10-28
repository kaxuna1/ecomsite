// World-Class Order Status Timeline Component
// Following 2025 UX best practices: clear progress visualization, animated states,
// checkmarks for completed steps, custom icons, accessible design

import { motion, useReducedMotion } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  HomeIcon,
  XCircleIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

interface TimelineStep {
  status: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isCompleted: boolean;
  isActive: boolean;
  isCancelled: boolean;
}

interface OrderStatusTimelineProps {
  currentStatus: string;
  createdAt: string;
  className?: string;
}

export default function OrderStatusTimeline({
  currentStatus,
  createdAt,
  className = ''
}: OrderStatusTimelineProps) {
  const prefersReducedMotion = useReducedMotion();

  // Define the order status flow
  const statusFlow = ['pending', 'confirmed', 'shipped', 'delivered'];
  const currentStatusLower = currentStatus.toLowerCase();
  const isCancelled = currentStatusLower === 'cancelled';

  // Get current step index
  const currentStepIndex = statusFlow.indexOf(currentStatusLower);
  const isValidStatus = currentStepIndex >= 0 || isCancelled;

  // Build timeline steps with completion state
  const steps: TimelineStep[] = [
    {
      status: 'pending',
      label: 'Order Placed',
      description: 'We received your order',
      icon: ShoppingBagIcon,
      isCompleted: true, // Always completed since order exists
      isActive: currentStatusLower === 'pending' && !isCancelled,
      isCancelled: false
    },
    {
      status: 'confirmed',
      label: 'Order Confirmed',
      description: 'Payment confirmed & preparing',
      icon: CheckCircleIcon,
      isCompleted: currentStepIndex >= 1,
      isActive: currentStatusLower === 'confirmed' && !isCancelled,
      isCancelled: false
    },
    {
      status: 'shipped',
      label: 'Shipped',
      description: 'Your order is on its way',
      icon: TruckIcon,
      isCompleted: currentStepIndex >= 2,
      isActive: currentStatusLower === 'shipped' && !isCancelled,
      isCancelled: false
    },
    {
      status: 'delivered',
      label: 'Delivered',
      description: 'Order successfully delivered',
      icon: HomeIcon,
      isCompleted: currentStepIndex >= 3,
      isActive: currentStatusLower === 'delivered' && !isCancelled,
      isCancelled: false
    }
  ];

  // If cancelled, mark all future steps as cancelled
  if (isCancelled) {
    steps.forEach((step, index) => {
      if (index > currentStepIndex) {
        step.isCancelled = true;
      }
    });
  }

  const getStepColor = (step: TimelineStep) => {
    if (step.isCancelled) return 'bg-red-100 text-red-600 border-red-300';
    if (step.isCompleted) return 'bg-jade text-white border-jade';
    if (step.isActive) return 'bg-blue-100 text-blue-600 border-blue-400 animate-pulse';
    return 'bg-gray-100 text-gray-400 border-gray-300';
  };

  const getLineColor = (index: number) => {
    if (isCancelled && index >= currentStepIndex) return 'bg-red-300';
    if (index < currentStepIndex) return 'bg-jade';
    return 'bg-gray-300';
  };

  return (
    <div className={`${className}`}>
      {/* Cancelled Banner */}
      {isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
        >
          <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Order Cancelled</p>
            <p className="text-sm text-red-700">This order has been cancelled and will not be processed.</p>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Desktop Timeline - Horizontal */}
        <div className="hidden md:block">
          <div className="flex items-start justify-between">
            {steps.map((step, index) => (
              <div key={step.status} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  {/* Icon Circle */}
                  <motion.div
                    initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className={`relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${getStepColor(
                      step
                    )}`}
                  >
                    {step.isCompleted && !step.isCancelled ? (
                      <CheckCircleSolid className="h-8 w-8" />
                    ) : step.isCancelled ? (
                      <XCircleIcon className="h-8 w-8" />
                    ) : (
                      <step.icon className="h-8 w-8" />
                    )}

                    {/* Pulse animation for active step */}
                    {step.isActive && !prefersReducedMotion && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-blue-400"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Label */}
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="mt-4 text-center"
                  >
                    <p
                      className={`font-semibold text-sm ${
                        step.isCompleted || step.isActive ? 'text-midnight' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-midnight/60 mt-1">{step.description}</p>
                  </motion.div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="absolute top-8 left-1/2 right-0 h-1 -z-0 origin-left"
                    style={{ width: 'calc(100% - 2rem)' }}
                  >
                    <div className={`h-full rounded ${getLineColor(index)} transition-all duration-500`} />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Timeline - Vertical */}
        <div className="md:hidden">
          <div className="relative pl-12">
            {/* Vertical Line */}
            <div className="absolute left-7 top-0 bottom-0 w-1 bg-gray-300" />

            {steps.map((step, index) => (
              <motion.div
                key={step.status}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pb-8 last:pb-0"
              >
                {/* Icon Circle */}
                <div
                  className={`absolute left-0 w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${getStepColor(
                    step
                  )}`}
                >
                  {step.isCompleted && !step.isCancelled ? (
                    <CheckCircleSolid className="h-7 w-7" />
                  ) : step.isCancelled ? (
                    <XCircleIcon className="h-7 w-7" />
                  ) : (
                    <step.icon className="h-7 w-7" />
                  )}

                  {/* Active pulse */}
                  {step.isActive && !prefersReducedMotion && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-blue-400"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  )}
                </div>

                {/* Completed segment of vertical line */}
                {step.isCompleted && index < steps.length - 1 && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="absolute left-7 top-14 w-1 bg-jade origin-top"
                    style={{ height: 'calc(100% - 3.5rem)' }}
                  />
                )}

                {/* Label */}
                <div className="pl-4">
                  <p
                    className={`font-semibold ${
                      step.isCompleted || step.isActive ? 'text-midnight' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-sm text-midnight/60 mt-1">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Date Footer */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-champagne/10 rounded-xl"
      >
        <div className="flex items-center justify-between text-sm">
          <p className="text-midnight/60">
            <span className="font-semibold text-midnight">Order Date:</span>{' '}
            {new Date(createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {currentStatusLower === 'delivered' && (
            <span className="px-3 py-1 bg-jade/20 text-jade rounded-full text-xs font-semibold">
              ✓ Completed
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
