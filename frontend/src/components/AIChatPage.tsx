import React, { useState, useEffect, useRef } from 'react';
import {
    Box, TextField, IconButton, Paper, Typography,
    CircularProgress, Avatar, Button, Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CalculateIcon from '@mui/icons-material/Calculate';
import ChatIcon from '@mui/icons-material/Chat';
import axios from 'axios';
import AmmoniaDesignWizard from './AmmoniaDesignWizard';


const AIChatPage: React.FC = () => {
    // 💾 Load history from local storage
    const [messages, setMessages] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('cool-assist-chat-history');
            return saved ? JSON.parse(saved) : [
                { id: 1, text: "Hello! 👋 I am your Intelligent Ammonia Refrigeration Engineer.\n\nDescribe your project in natural language, for example:\n• Poultry slaughterhouse with 4 blast freezers at -40°C\n• 5000-ton cold storage in Tehran\n• Red meat pre-cooling room", sender: 'ai' }
            ];
        } catch (e) {
            return [{ id: 1, text: "Hello! 👋 I am your Intelligent Ammonia Refrigeration Engineer.", sender: 'ai' }];
        }
    });

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [designData, setDesignData] = useState<any | null>(null);
    const [calculateMode, setCalculateMode] = useState(false); // 🧮 Toggle for calculation mode
    const endRef = useRef<HTMLDivElement>(null);

    // 💾 Save history to local storage
    useEffect(() => {
        localStorage.setItem('cool-assist-chat-history', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const msg = input;
        setInput('');
        setMessages(p => [...p, { id: Date.now(), text: msg, sender: 'user' }]);
        setLoading(true);

        try {
            if (calculateMode) {
                // 🧮 CALCULATION MODE: Run full design calculations
                const res = await axios.post('http://localhost:5000/api/core/design', { message: msg });

                if (res.data && res.data.success) {
                    setDesignData(res.data);
                    const totalLoad = res.data.summary?.totalCoolingLoad ? Math.round(res.data.summary.totalCoolingLoad) : 0;
                    const cost = res.data.summary?.totalCost ? `$${(res.data.summary.totalCost || 0).toLocaleString()}` : "N/A";
                    const projectName = res.data.project?.name || 'New Project';
                    const reply = `✅ طراحی کامل شد!\n\nنام پروژه: ${projectName}\nبار سرمایشی کل: ${totalLoad} kW\nهزینه تخمینی: ${cost}\n\nطراحی، P&ID و انتخاب تجهیزات انجام شد. از سمت راست می‌توانید جزئیات را ببینید.`;
                    setMessages(p => [...p, { id: Date.now() + 1, text: reply, sender: 'ai' }]);
                } else {
                    const errorMsg = res.data?.error || 'خطای نامشخص در محاسبات';
                    setMessages(p => [...p, { id: Date.now() + 1, text: `❌ خطای محاسبات: ${errorMsg}`, sender: 'ai' }]);
                }
            } else {
                // 💬 CHAT MODE: Conversational AI response
                const res = await axios.post('http://localhost:5000/api/core/chat', { message: msg });

                if (res.data && res.data.success) {
                    const reply = res.data.response || 'متوجه نشدم. لطفاً دوباره توضیح دهید.';
                    setMessages(p => [...p, { id: Date.now() + 1, text: reply, sender: 'ai' }]);
                } else {
                    // Fallback conversational response
                    setMessages(p => [...p, { id: Date.now() + 1, text: `🤔 متوجه سوال شما شدم. اگر می‌خواهید محاسبات انجام شود، لطفاً دکمه "محاسبه" را فعال کنید.\n\nدر غیر اینصورت، می‌توانم درباره سیستم‌های تبرید آمونیاکی، تجهیزات، استانداردها و موارد فنی به شما توضیح دهم.`, sender: 'ai' }]);
                }
            }
        } catch (e: any) {
            console.error("Error:", e);
            if (!calculateMode) {
                // In chat mode, provide helpful fallback
                setMessages(p => [...p, { id: Date.now() + 1, text: `💬 من مهندس تبرید آمونیاکی هستم. می‌توانم به سوالات شما پاسخ دهم. اگر می‌خواهید طراحی و محاسبات انجام شود، دکمه "محاسبه" را فعال کنید.`, sender: 'ai' }]);
            } else {
                const errMsg = e.response?.data?.error || 'خطا در پردازش درخواست';
                setMessages(p => [...p, { id: Date.now() + 1, text: `❌ خطا: ${errMsg}`, sender: 'ai' }]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setDesignData(null);
        setMessages(p => [...p, { id: Date.now(), text: "--- New Design Started ---", sender: 'ai' }]);
    };

    const clearHistory = () => {
        if (window.confirm("Are you sure you want to clear chat history?")) {
            setMessages([
                { id: 1, text: "Hello! 👋 I am your Intelligent Ammonia Refrigeration Engineer.\n\nDescribe your project in natural language.", sender: 'ai' }
            ]);
            localStorage.removeItem('cool-assist-chat-history');
            setDesignData(null);
        }
    };

    return (
        <Box display="flex" height="calc(100vh - 64px)" bgcolor="#eee" p={2} gap={2}>
            <Paper elevation={3} sx={{ width: 350, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <Box p={2} bgcolor="primary.main" color="white" display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                        <SmartToyIcon sx={{ mr: 1 }} /> <Typography variant="h6">AI Engineer</Typography>
                    </Box>
                    <Typography
                        variant="caption"
                        sx={{ cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1, textDecoration: 'underline' } }}
                        onClick={clearHistory}
                    >
                        Clear History
                    </Typography>
                </Box>
                <Box flexGrow={1} p={2} overflow="auto">
                    {messages.map(m => (
                        <Box key={m.id} display="flex" justifyContent={m.sender === 'user' ? 'flex-end' : 'flex-start'} mb={2}>
                            {m.sender === 'ai' && <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}><SmartToyIcon fontSize="small" /></Avatar>}
                            <Paper sx={{ p: 1.5, maxWidth: '80%', bgcolor: m.sender === 'user' ? 'primary.light' : 'white', color: m.sender === 'user' ? 'white' : 'black' }}>
                                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
                            </Paper>
                        </Box>
                    ))}
                    {loading && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}><SmartToyIcon fontSize="small" /></Avatar>
                            <CircularProgress size={20} />
                        </Box>
                    )}
                    <div ref={endRef} />
                </Box>
                <Box p={2} bgcolor="white" display="flex" flexDirection="column" gap={1}>
                    {/* Calculate Mode Toggle */}
                    <Box display="flex" justifyContent="center">
                        <Tooltip title={calculateMode ? "حالت محاسبه فعال است - پیام شما باعث طراحی و محاسبات می‌شود" : "حالت گفتگو - می‌توانید سوال بپرسید بدون محاسبه"}>
                            <Button
                                variant={calculateMode ? "contained" : "outlined"}
                                color={calculateMode ? "success" : "primary"}
                                size="small"
                                onClick={() => setCalculateMode(!calculateMode)}
                                startIcon={calculateMode ? <CalculateIcon /> : <ChatIcon />}
                                sx={{ borderRadius: 3, textTransform: 'none', fontSize: 12 }}
                            >
                                {calculateMode ? "🧮 محاسبه فعال" : "💬 گفتگو"}
                            </Button>
                        </Tooltip>
                    </Box>
                    {/* Input Row */}
                    <Box display="flex">
                        <TextField
                            fullWidth
                            size="small"
                            placeholder={calculateMode ? "پروژه خود را توصیف کنید..." : "سوال خود را بپرسید..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        />
                        <IconButton color="primary" onClick={handleSend} disabled={loading}><SendIcon /></IconButton>
                    </Box>
                </Box>
            </Paper>
            <Box flexGrow={1} borderRadius={2} overflow="hidden">
                <AmmoniaDesignWizard projectData={designData} onReset={handleReset} />
            </Box>
        </Box>
    );
};

export default AIChatPage;
