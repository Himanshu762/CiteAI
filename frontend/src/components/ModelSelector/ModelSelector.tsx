import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Cpu, CheckCircle, XCircle, Loader2, RefreshCw,
    Zap, Clock, Brain, ChevronDown
} from 'lucide-react';
import { getModelsWithStatus, ModelInfo, checkModelStatus } from '../../services/model-status';
import { Badge } from '../ui/components';

interface ModelSelectorProps {
    selectedModel: string;
    onModelSelect: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onModelSelect }: ModelSelectorProps) {
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadModels = async () => {
        setIsLoading(true);
        try {
            const modelList = await getModelsWithStatus();
            setModels(modelList);
        } catch (error) {
            console.error('Failed to load models:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshStatus = async () => {
        setIsRefreshing(true);
        try {
            const modelList = await getModelsWithStatus();
            setModels(modelList);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadModels();
    }, []);

    const selectedModelInfo = models.find(m => m.id === selectedModel);

    const getSpeedIcon = (speed: ModelInfo['responseSpeed']) => {
        switch (speed) {
            case 'fast': return <Zap className="w-3 h-3 text-green-500" />;
            case 'medium': return <Clock className="w-3 h-3 text-amber-500" />;
            case 'slow': return <Clock className="w-3 h-3 text-red-500" />;
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading models...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Cpu size={14} />
                    AI Model
                </label>
                <button
                    onClick={refreshStatus}
                    disabled={isRefreshing}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title="Refresh status"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Selected Model Display */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-left hover:border-blue-400 transition-colors"
            >
                {selectedModelInfo ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${selectedModelInfo.isOnline ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white text-sm">
                                    {selectedModelInfo.name}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {selectedModelInfo.description.slice(0, 50)}...
                                </p>
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''
                            }`} />
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm">Select a model</p>
                )}
            </button>

            {/* Model List (Expanded) */}
            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 max-h-80 overflow-y-auto"
                >
                    {models.map((model) => (
                        <motion.button
                            key={model.id}
                            onClick={() => {
                                onModelSelect(model.id);
                                setIsExpanded(false);
                            }}
                            disabled={!model.isOnline}
                            className={`w-full p-3 rounded-lg border text-left transition-all ${selectedModel === model.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : model.isOnline
                                        ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                                        : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 opacity-60 cursor-not-allowed'
                                }`}
                            whileHover={model.isOnline ? { scale: 1.01 } : {}}
                            whileTap={model.isOnline ? { scale: 0.99 } : {}}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        {model.isOnline ? (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                                            {model.name}
                                        </span>
                                        {model.isFree && (
                                            <Badge variant="success" className="text-[10px]">FREE</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 ml-6">
                                        {model.description}
                                    </p>

                                    {/* Strengths */}
                                    <div className="flex flex-wrap gap-1 mt-2 ml-6">
                                        {model.strengths.slice(0, 3).map((strength, i) => (
                                            <span
                                                key={i}
                                                className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded"
                                            >
                                                {strength}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Speed indicator */}
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    {getSpeedIcon(model.responseSpeed)}
                                    <span className="capitalize">{model.responseSpeed}</span>
                                </div>
                            </div>

                            {!model.isOnline && (
                                <p className="text-xs text-red-500 mt-2 ml-6">
                                    Currently unavailable
                                </p>
                            )}
                        </motion.button>
                    ))}
                </motion.div>
            )}

            {/* Context length info */}
            {selectedModelInfo && !isExpanded && (
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        {(selectedModelInfo.contextLength / 1000).toFixed(0)}K context
                    </span>
                    <span className="flex items-center gap-1">
                        {getSpeedIcon(selectedModelInfo.responseSpeed)}
                        {selectedModelInfo.responseSpeed} speed
                    </span>
                </div>
            )}
        </div>
    );
}
