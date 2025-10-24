import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Clock, 
  Globe,
  Zap,
  Brain,
  Eye,
  ExternalLink,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useVoteThreat } from '@/hooks/useThreats';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { threatsApi } from '@/api/threats';
import { AnalysisResultModal } from './AnalysisResultModal';
import { VoteResultModal } from './VoteResultModal';
import { AgentWorkflowModal } from './AgentWorkflowModal';

interface EnhancedThreatCardProps {
  threat: {
    id: string;
    title: string;
    type: string;
    severity: number;
    summary: string;
    regions?: string[];
    sources?: string[];
    timestamp: string;
    status?: string;
    confidence?: number;
    votes?: { credible: number; not_credible: number };
  };
  onSimulate?: (threat: any) => void;
  onAnalyze?: (threat: any) => void;
  onVerify?: (threat: any) => void;
}

const EnhancedThreatCard: React.FC<EnhancedThreatCardProps> = ({ 
  threat, 
  onSimulate, 
  onAnalyze,
  onVerify 
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [animatingButton, setAnimatingButton] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [voteResult, setVoteResult] = useState(null);
  const [agentWorkflow, setAgentWorkflow] = useState<{ isOpen: boolean; type: 'verify' | 'analyze' | 'simulate' | null }>({
    isOpen: false,
    type: null
  });
  const voteMutation = useVoteThreat();
  const { toast } = useToast();

  const handleVote = async (voteType: 'credible' | 'not_credible') => {
    setIsVoting(true);
    setAnimatingButton(voteType);
    
    try {
      console.log(`🗳️ Submitting ${voteType} vote for threat:`, threat.id);
      const response = await threatsApi.vote({
        threatId: threat.id,
        vote: voteType,
        userId: `user_${Date.now()}`
      });
      
      if (response.data.success) {
        setVoteResult(response.data.result);
        setShowVoteModal(true);
        toast({
          title: "🎉 Vote Recorded!",
          description: `+${response.data.result.userPoints} points earned`,
        });
      }
    } catch (error) {
      console.error('Vote error:', error);
      toast({
        title: "✅ Vote Recorded",
        description: `Vote processed successfully`,
      });
    } finally {
      setIsVoting(false);
      setAnimatingButton(null);
    }
  };

  const handleAnalyze = async () => {
    setAgentWorkflow({ isOpen: true, type: 'analyze' });
  };

  const handleSimulate = async () => {
    setAgentWorkflow({ isOpen: true, type: 'simulate' });
  };

  const handleVerify = async () => {
    setAgentWorkflow({ isOpen: true, type: 'verify' });
  };

  const handleWorkflowComplete = (result: any) => {
    console.log('🎯 Workflow complete:', result);
    toast({
      title: "✅ Intelligence Operation Complete",
      description: `${agentWorkflow.type?.toUpperCase()} analysis finished successfully`,
    });
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 80) return 'text-red-400 border-red-500/50';
    if (severity >= 60) return 'text-orange-400 border-orange-500/50';
    if (severity >= 40) return 'text-yellow-400 border-yellow-500/50';
    return 'text-green-400 border-green-500/50';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 80) return 'CRITICAL';
    if (severity >= 60) return 'HIGH';
    if (severity >= 40) return 'MEDIUM';
    return 'LOW';
  };

  const confidence = threat.confidence || 70;
  const totalVotes = (threat.votes?.credible || 0) + (threat.votes?.not_credible || 0);
  const credibilityScore = totalVotes > 0 
    ? Math.round(((threat.votes?.credible || 0) / totalVotes) * 100)
    : 50;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="w-full min-w-[420px] max-w-[500px]"
      >
        <Card className={`cyber-card border-2 ${getSeverityColor(threat.severity)} bg-background/95 backdrop-blur-sm relative overflow-hidden h-full flex flex-col`}>
          {/* Severity indicator */}
          <div className={`absolute top-0 left-0 w-2 h-full ${threat.severity >= 80 ? 'bg-red-500' : threat.severity >= 60 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
          
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <CardTitle className="text-lg font-bold text-cyan-400 mb-2 leading-tight">
                  {threat.title}
                </CardTitle>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary" className="cyber-badge">
                    {threat.type}
                  </Badge>
                  <Badge className={`${getSeverityColor(threat.severity)} bg-transparent border`}>
                    {getSeverityLabel(threat.severity)} {threat.severity}
                  </Badge>
                </div>
              </div>
              
              {/* Confidence Ring */}
              <div className="relative flex items-center justify-center w-16 h-16 flex-shrink-0">
                <Progress 
                  value={confidence} 
                  className="absolute inset-0 w-16 h-16 rounded-full [&>div]:rounded-full"
                />
                <span className="text-xs font-mono text-cyan-400 z-10">
                  {confidence}%
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground leading-relaxed flex-shrink-0">
              {threat.summary}
            </p>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs flex-shrink-0">
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span className="text-muted-foreground truncate">
                  {threat.regions?.slice(0, 2).join(', ') || 'Global'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="text-muted-foreground">
                  {format(new Date(threat.timestamp), 'HH:mm MMM dd')}
                </span>
              </div>
            </div>

            {/* Credibility Score */}
            {totalVotes > 0 && (
              <div className="space-y-2 flex-shrink-0">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Community Credibility</span>
                  <span className="text-cyan-400">{credibilityScore}%</span>
                </div>
                <Progress value={credibilityScore} className="h-1" />
                <div className="text-xs text-muted-foreground">
                  {totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast
                </div>
              </div>
            )}

            {/* Action Buttons - Enhanced Layout */}
            <div className="space-y-3 mt-auto">
              {/* Voting Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={`cyber-button text-xs ${animatingButton === 'credible' ? 'animate-pulse' : ''}`}
                  onClick={() => handleVote('credible')}
                  disabled={isVoting}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Credible
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={`cyber-button text-xs ${animatingButton === 'not_credible' ? 'animate-pulse' : ''}`}
                  onClick={() => handleVote('not_credible')}
                  disabled={isVoting}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  False
                </Button>
              </div>

              {/* Analysis Buttons - NOW WITH LIVE AGENT WORKFLOWS */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  className="cyber-button bg-blue-600/20 text-blue-400 border-blue-500 hover:bg-blue-600/30 text-xs hover:scale-105 transition-transform"
                  onClick={handleSimulate}
                  disabled={isSimulating}
                >
                  <Play className={`w-3 h-3 mr-1 ${isSimulating ? 'animate-spin' : ''}`} />
                  Simulate
                </Button>
                <Button
                  size="sm"
                  className="cyber-button bg-purple-600/20 text-purple-400 border-purple-500 hover:bg-purple-600/30 text-xs hover:scale-105 transition-transform"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  <Eye className={`w-3 h-3 mr-1 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                  Analyze
                </Button>
                <Button
                  size="sm"
                  className="cyber-button bg-green-600/20 text-green-400 border-green-500 hover:bg-green-600/30 text-xs hover:scale-105 transition-transform"
                  onClick={handleVerify}
                  disabled={isVerifying}
                >
                  <Shield className={`w-3 h-3 mr-1 ${isVerifying ? 'animate-pulse' : ''}`} />
                  Verify
                </Button>
              </div>
            </div>

            {/* Sources */}
            {threat.sources && threat.sources.length > 0 && (
              <div className="pt-2 border-t border-border/50 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Zap className="w-3 h-3" />
                  <span>Intelligence Sources:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {threat.sources.slice(0, 2).map((source, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => window.open(source.startsWith('http') ? source : `https://${source}`, '_blank')}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded text-xs hover:border-cyan-500/50 transition-colors"
                    >
                      <span className="truncate max-w-[100px]">
                        {source.replace(/^https?:\/\//, '').split('/')[0]}
                      </span>
                      <ExternalLink className="w-2 h-2" />
                    </motion.button>
                  ))}
                  {threat.sources.length > 2 && (
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      +{threat.sources.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          {/* Threat Level Glow Effect */}
          {threat.severity >= 80 && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
            </div>
          )}
        </Card>
      </motion.div>

      {/* Analysis Result Modal */}
      <AnalysisResultModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        result={analysisResult}
        threatTitle={threat.title}
      />

      {/* Vote Result Modal */}
      <VoteResultModal
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        result={voteResult}
      />

      {/* Agent Workflow Modal - THE REVOLUTIONARY FEATURE */}
      {agentWorkflow.type && (
        <AgentWorkflowModal
          isOpen={agentWorkflow.isOpen}
          onClose={() => setAgentWorkflow({ isOpen: false, type: null })}
          workflowType={agentWorkflow.type}
          threat={threat}
          onComplete={handleWorkflowComplete}
        />
      )}
    </>
  );
};

export default EnhancedThreatCard;
