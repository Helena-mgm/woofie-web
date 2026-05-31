import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface ErrorAlertProps {
  message: string;
}

/**
 * Composant pour afficher les messages d'erreur
 */
export const ErrorAlert = memo<ErrorAlertProps>(({ message }) => (
  <motion.div
    className="bg-red-100 text-red-800 p-3 mb-4 rounded-lg text-sm"
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.9, opacity: 0 }}
  >
    {message}
  </motion.div>
));

ErrorAlert.displayName = 'ErrorAlert';

interface SuccessAlertProps {
  message: string;
}

/**
 * Composant pour afficher les messages de succès
 */
export const SuccessAlert = memo<SuccessAlertProps>(({ message }) => (
  <motion.div
    className="bg-green-100 text-green-800 p-3 mb-4 rounded-lg text-sm"
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.9, opacity: 0 }}
  >
    {message}
  </motion.div>
));

SuccessAlert.displayName = 'SuccessAlert';
