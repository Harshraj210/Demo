"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { 
    Calendar,
    Trophy,
    Flame,
    Github,
    X,
    Star
} from 'lucide-react';
import { useTheme } from "next-themes";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { USER_PROFILE, TOPICS, USER_STATS, generateContributionData } from '@/lib/data';

// Dynamically import ActivityCalendar to avoid SSR issues and type errors
const ActivityCalendar = dynamic(
    () => import('react-activity-calendar').then((mod: any) => mod.ActivityCalendar),
    { ssr: false }
) as any;

type Activity = {
    date: string;
    count: number;
    level: number;
};

export default function ProfilePage() {
    // Use state to hold data only after mount to prevent hydration mismatch
    const [contributionData, setContributionData] = useState<Activity[]>([]);
    const [mounted, setMounted] = useState(false);
    
    // Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: USER_PROFILE.name
    });
    const [editForm, setEditForm] = useState(profile);
    const [selectedTopic, setSelectedTopic] = useState<typeof TOPICS[0] | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        setContributionData(generateContributionData());
        
        // Load persist profile data
        const savedName = localStorage.getItem('user_name');
        if (savedName) {
            setProfile(p => ({ ...p, name: savedName }));
            setEditForm(p => ({ ...p, name: savedName }));
        }

        setMounted(true);
    }, []);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setEditForm(profile); // Reset form on toggle
    };

    const handleSave = () => {
        localStorage.setItem('user_name', editForm.name);
        setProfile(editForm);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm(profile);
    };

    if (!mounted) {
        return <div className="p-8 flex items-center justify-center min-h-[50vh]">
            <div className="animate-pulse text-muted-foreground">Loading specific profile data...</div>
        </div>;
    }

    return (
        <div className="p-4 pt-16 md:p-8 md:pt-8 max-w-5xl mx-auto space-y-8 relative animate-in fade-in duration-500">
            
            {/* User Info Card */}
            <div className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                {/* Decorative Banner */}
                <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
                </div>
                
                <div className="p-6 pt-0 relative flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Avatar with overlapping positioning */}
                    <div className="-mt-12 shrink-0 relative">
                        <div className="h-32 w-32 rounded-full border-4 border-background bg-card flex items-center justify-center shadow-lg">
                            <span className="text-5xl font-bold text-primary bg-primary/10 w-full h-full flex items-center justify-center rounded-full">
                                {profile.name.charAt(0)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left space-y-3 w-full mt-2 md:mt-4">
                        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4">
                            {isEditing ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                                    <Input 
                                        value={editForm.name} 
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        placeholder="Your Name"
                                        className="text-2xl font-bold h-auto py-1 px-3 w-full md:w-auto min-w-[300px]"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">{profile.name}</h2>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <Button onClick={handleSave} className="gap-2 shadow-sm">
                                            Save Changes
                                        </Button>
                                        <Button variant="outline" onClick={handleCancel} className="gap-2">
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="outline" onClick={handleEditToggle} className="gap-2 hover:bg-primary/5 transition-colors">
                                        <Github className="h-4 w-4" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                        {/* Topics Section */}
                        <div className="pt-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Primary Skills</p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {TOPICS.map(topic => (
                                    <div 
                                        key={topic.id}
                                        onClick={() => setSelectedTopic(topic)}
                                        className="group/tag bg-muted/50 hover:bg-primary/10 border border-border hover:border-primary/30 rounded-full px-4 py-1.5 text-sm flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105"
                                    >
                                        <span className="font-medium group-hover/tag:text-primary transition-colors">{topic.name}</span>
                                        {topic.confidence > 0 && (
                                            <div className="flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full bg-background/50" title={`Confidence: ${topic.confidence}/5`}>
                                                <span className="text-[10px] font-bold text-yellow-500">{topic.confidence}</span>
                                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { 
                        label: 'Current Streak', 
                        value: `${USER_STATS.currentStreak} Days`, 
                        subtext: 'Feb 18 - Mar 1', // Dummy date
                        icon: Flame, 
                        color: 'text-orange-500', 
                        bg: 'bg-orange-500/10' 
                    },
                    { 
                        label: 'Longest Streak', 
                        value: `${USER_STATS.longestStreak} Days`, 
                        subtext: 'All time record',
                        icon: Trophy, 
                        color: 'text-yellow-500', 
                        bg: 'bg-yellow-500/10' 
                    },
                    { 
                        label: 'Total Contributions', 
                        value: USER_STATS.totalContributions.toLocaleString(), 
                        subtext: 'Last 12 months',
                        icon: Calendar, 
                        color: 'text-green-500', 
                        bg: 'bg-green-500/10' 
                    }
                ].map((stat, i) => (
                    <div key={i} className="group bg-card border border-border rounded-xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                        <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</p>
                            <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                            <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Heatmap Section */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold">Contribution Activity</h3>
                        <p className="text-sm text-muted-foreground">Visualize your daily coding habits.</p>
                    </div>
                    <select className="bg-background border border-border rounded-md text-sm px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-auto">
                        <option>2024</option>
                        <option>2023</option>
                    </select>
                </div>
                
                <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                    <div className="min-w-[800px] flex justify-center">
                         <ActivityCalendar
                            data={contributionData}
                            colorScheme={theme === 'dark' ? 'dark' : 'light'}
                            blockSize={14}
                            blockMargin={4}
                            fontSize={14}
                            theme={{
                                light: ['#f1f5f9', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81'], // Indigo scale
                                dark: ['#1e293b', '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd'], // Blue scale
                            }}
                            showWeekdayLabels
                            renderBlock={(block: any, activity: any) => 
                                React.cloneElement(block, {
                                    'data-tooltip-id': 'react-tooltip',
                                    'data-tooltip-content': `${activity.count} contributions on ${activity.date}`,
                                    style: { ...block.props.style, borderRadius: '4px' } // Rounder blocks
                                })
                            }
                        />
                    </div>
                    <ReactTooltip id="react-tooltip" className="!bg-foreground !text-background !px-3 !py-1 !content-xs !rounded-md !shadow-xl" />
                </div>
            </div>

            {/* Topic Details Modal */}
            {selectedTopic && (
                <div 
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedTopic(null)}
                >
                    <div 
                        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-24 bg-gradient-to-r from-primary/10 to-transparent relative border-b border-border/50">
                            <div className="absolute bottom-0 left-6 translate-y-1/2">
                                <div className="h-16 w-16 rounded-xl bg-background border shadow-sm flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary">{selectedTopic.name.charAt(0)}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full bg-background/50 hover:bg-background" onClick={() => setSelectedTopic(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="pt-10 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold">{selectedTopic.name}</h3>
                                    <p className="text-muted-foreground text-sm">Competency Breakdown</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1">
                                        <span className="text-2xl font-bold text-primary">{selectedTopic.confidence}</span>
                                        <span className="text-muted-foreground text-sm">/ 5</span>
                                    </div>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} className={`h-3 w-3 ${s <= selectedTopic.confidence ? "fill-yellow-500 text-yellow-500" : "text-border"}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {selectedTopic.subTopics?.map((sub, idx) => (
                                    <div key={idx} className="group flex items-center justify-between p-3 rounded-xl border border-border/40 hover:border-primary/30 hover:bg-muted/30 transition-all duration-200">
                                        <span className="font-medium">{sub.name}</span>
                                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star 
                                                    key={star} 
                                                    className={`h-4 w-4 transition-colors duration-300 ${
                                                        star <= sub.confidence 
                                                            ? 'fill-yellow-500 text-yellow-500' 
                                                            : 'text-muted-foreground/20'
                                                    }`} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {(!selectedTopic.subTopics || selectedTopic.subTopics.length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                                        No specific sub-topics tracked yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
