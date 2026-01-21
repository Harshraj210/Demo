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
    Star,
    Loader2
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
        name: USER_PROFILE.name || "User"
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
        } else if (!USER_PROFILE.name) {
             setProfile(p => ({ ...p, name: "User" }));
             setEditForm(p => ({ ...p, name: "User" }));
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
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>;
    }

    return (
        <div className="p-4 pt-20 md:p-8 md:pt-8 max-w-5xl mx-auto space-y-6 md:space-y-8 relative animate-in fade-in duration-500 pb-24 h-full overflow-y-auto">
            
            {/* User Info Card */}
            <div className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                {/* Banner */}
                <div className="h-32 sm:h-40 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative shrink-0">
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
                </div>
                
                <div className="px-6 pb-6 relative">
                    {/* Avatar - Centered on mobile, Left on desktop */}
                    <div className="flex justify-center md:justify-start -mt-16 mb-4 relative z-10">
                        <div className="h-32 w-32 rounded-full border-[6px] border-card bg-card flex items-center justify-center shadow-lg">
                            <span className="text-5xl font-bold text-primary bg-primary/10 w-full h-full flex items-center justify-center rounded-full">
                                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Main Info */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                             <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                                {isEditing ? (
                                    <div className="w-full md:w-auto">
                                        <Input 
                                            value={editForm.name} 
                                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                            placeholder="Your Name"
                                            className="text-2xl font-bold h-12 text-center md:text-left"
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{profile.name}</h2>
                                        <p className="text-muted-foreground font-medium">{USER_PROFILE.role || "Full Stack Developer"}</p>
                                    </div>
                                )}

                                <div>
                                    {isEditing ? (
                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                            <Button onClick={handleSave} size="sm">Save</Button>
                                            <Button variant="outline" onClick={handleCancel} size="sm">Cancel</Button>
                                        </div>
                                    ) : (
                                        <Button variant="outline" onClick={handleEditToggle} size="sm" className="gap-2 rounded-full">
                                            <Github className="h-4 w-4" />
                                            Edit Profile
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Topics */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">Compentencies</p>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    {TOPICS.map(topic => (
                                        <div 
                                            key={topic.id}
                                            onClick={() => setSelectedTopic(topic)}
                                            className="cursor-pointer px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-colors flex items-center gap-1.5 border border-transparent hover:border-primary/20 group/star"
                                        >
                                            <span>{topic.name}</span>
                                            <div className="flex items-center gap-0.5 ml-1 bg-background/50 px-1 py-0.5 rounded-full">
                                                <span className="text-[10px] font-bold text-yellow-500">{topic.confidence}</span>
                                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {[
                    { 
                        label: 'Current Streak', 
                        value: `${USER_STATS.currentStreak} Days`, 
                        subtext: 'Feb 18 - Mar 1', 
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
                    <div key={i} className="group bg-card border border-border rounded-xl p-4 md:p-6 flex items-center gap-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                        <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300 shadow-inner shrink-0`}>
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
            <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-4 md:p-8 shadow-lg space-y-6 relative overflow-hidden min-h-[300px] max-w-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                             Activity Map
                        </h3>
                        <p className="text-sm text-muted-foreground">Your contribution history.</p>
                    </div>
                    {/* Select removed for simplicity on mobile, or kept */}
                </div>
                
                <div className="w-full overflow-x-scroll pb-4 touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {contributionData.length > 0 ? (
                        <div className="min-w-[700px] flex justify-center py-4 px-2">
                             <ActivityCalendar
                                data={contributionData}
                                colorScheme={theme === 'dark' ? 'dark' : 'light'}
                                blockSize={12}
                                blockMargin={4}
                                fontSize={12}
                                theme={{
                                    light: ['#000000', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81'],
                                    dark: ['#000000', '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd'],
                                }}
                                showWeekdayLabels
                                hideTotalCount
                                renderBlock={(block: any, activity: any) => 
                                    React.cloneElement(block, {
                                        'data-tooltip-id': 'react-tooltip',
                                        'data-tooltip-content': `${activity.count} contributions on ${activity.date}`,
                                        style: { 
                                            ...block.props.style, 
                                            borderRadius: '2px',
                                            stroke: theme === 'dark' ? '#ffffff10' : 'transparent',
                                            strokeWidth: 1,
                                            fill: activity.count === 0 ? '#000000' : undefined 
                                        } 
                                    })
                                }
                            />
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-muted-foreground">
                            No contribution data available.
                        </div>
                    )}
                    <ReactTooltip id="react-tooltip" className="!bg-foreground !text-background !px-3 !py-1 !text-xs !rounded-md !shadow-xl !font-medium" />
                </div>
            </div>

            {/* Topic Details Modal - Restored */}
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
                            {/* Banner Decoration */}
                            <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-white/5" />
                            
                            <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full bg-background/50 hover:bg-background z-10" onClick={() => setSelectedTopic(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                        <span className="text-2xl font-bold text-primary">{selectedTopic.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold leading-none mb-1">{selectedTopic.name}</h3>
                                        <p className="text-muted-foreground text-sm">Competency Breakdown</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <div className="flex items-center gap-1">
                                        <span className="text-xl font-bold text-primary">{selectedTopic.confidence}</span>
                                        <span className="text-muted-foreground text-xs">/ 5</span>
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
                                        <span className="font-medium text-sm md:text-base">{sub.name}</span>
                                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star 
                                                    key={star} 
                                                    className={`h-3.5 w-3.5 transition-colors duration-300 ${
                                                        star <= sub.confidence 
                                                            ? 'fill-yellow-500 text-yellow-500' 
                                                            : 'text-muted-foreground/20'
                                                    }`} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
