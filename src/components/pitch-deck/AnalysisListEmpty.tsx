import { AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AnalysisListEmpty() {
  const navigate = useNavigate();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };
  
  return (
    <motion.div 
      className="flex flex-col items-center justify-center text-center py-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="p-4 rounded-full bg-primary/5 mb-4"
        variants={itemVariants}
      >
        <AlertCircle className="h-12 w-12 text-primary/80" />
      </motion.div>
      <motion.h3 
        className="text-xl font-medium mb-2"
        variants={itemVariants}
      >
        No analyses found
      </motion.h3>
      <motion.p 
        className="text-muted-foreground mb-8 max-w-md"
        variants={itemVariants}
      >
        Upload your pitch deck to receive AI-powered feedback, suggestions, and a comprehensive analysis of your presentation.
      </motion.p>
      <motion.div variants={itemVariants}>
        <Button 
          onClick={() => navigate('/pitch-deck-analysis')}
          className="px-6 py-2 h-auto gap-2"
          size="lg"
        >
          <Upload className="h-4 w-4" />
          Upload Pitch Deck
        </Button>
      </motion.div>
    </motion.div>
  );
}
