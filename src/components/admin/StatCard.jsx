import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color = 'bg-blue-500',
  bgLight = 'bg-blue-50',
  trend,
  delay = 0 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-stone-500 mb-1">{label}</p>
              <p className="text-3xl font-bold text-[#2C3E1F]">{value}</p>
              {trend && (
                <p className={`text-xs mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.positive ? '↑' : '↓'} {trend.value}
                </p>
              )}
            </div>
            <div className={`w-14 h-14 ${bgLight} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}