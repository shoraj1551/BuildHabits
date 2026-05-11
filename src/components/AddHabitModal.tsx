import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useHabitStore } from '../store/useHabitStore';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose }) => {
  const addHabit = useHabitStore((state) => state.addHabit);
  const habits = useHabitStore((state) => state.habits);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const activeCategoryCount = habits.filter((habit) => !habit.isArchived && habit.category === category).length;
  const isCategoryLimitReached = activeCategoryCount >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCategoryLimitReached) return;
    
    addHabit({
      title: title.trim(),
      description: description.trim(),
      isPremium: false,
      category,
    });
    
    setTitle('');
    setDescription('');
    setCategory('General');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Create New Habit</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Habit Name
                    </label>
                    <input
                      id="title"
                      type="text"
                      autoFocus
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Read for 30 minutes"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Category
                    </label>
                    <input
                      id="category"
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="General"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                    <p className={`mt-1 text-xs ${isCategoryLimitReached ? 'text-red-600' : 'text-slate-500'}`}>
                      {activeCategoryCount}/10 active habits in this category
                    </p>
                  </div>

                  <div>
                    <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Description <span className="font-normal text-slate-400">(Optional)</span>
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add some context or motivation..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCategoryLimitReached}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-600/20"
                  >
                    Save Habit
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
