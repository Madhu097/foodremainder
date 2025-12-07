import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    Mail,
    MessageCircle,
    HelpCircle,
    Send,
    CheckCircle2,
    Clock,
    Users,
    Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { safeLocalStorage } from "@/lib/storage";
import { API_BASE_URL } from "@/lib/api";

export default function HelpContactPage() {
    const [, setLocation] = useLocation();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { toast } = useToast();

    const [contactForm, setContactForm] = useState({
        subject: "",
        category: "general",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useState(() => {
        const userStr = safeLocalStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                setIsAuthenticated(true);
            } catch (err) {
                console.error("Error parsing user:", err);
            }
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // In a real app, this would send to an API endpoint
            // For now, we'll simulate it
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: "Message Sent!",
                description: "We've received your message and will respond within 24-48 hours.",
            });

            // Reset form
            setContactForm({
                subject: "",
                category: "general",
                message: "",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        safeLocalStorage.removeItem("user");
        setIsAuthenticated(false);
        setCurrentUser(null);
        setLocation("/");
    };

    const faqs = [
        {
            question: "How do I add a food item?",
            answer: "Go to your Dashboard and click the '+ Add Food Item' button. Fill in the details including name, category, purchase date, and expiry date."
        },
        {
            question: "How do notifications work?",
            answer: "You can configure notifications in your Profile → Notification Settings. Enable email, WhatsApp, Telegram, or browser notifications to receive alerts when food items are expiring."
        },
        {
            question: "Can I change my notification frequency?",
            answer: "Yes! In your Profile settings, you can set how many times per day you want to receive notifications (1-4 times daily)."
        },
        {
            question: "How do I change my avatar?",
            answer: "Go to your Profile page, hover over your avatar, and click the camera icon. Choose from 7 Avengers-themed avatars!"
        },
        {
            question: "What happens to expired items?",
            answer: "Expired items remain in your list but are highlighted. You can delete them manually or keep them for record-keeping purposes."
        },
        {
            question: "Is my data safe?",
            answer: "Yes! If you've configured Firebase, your data is stored securely in Firebase Firestore. Otherwise, it's stored in-memory during your session."
        },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <Navbar isAuthenticated={isAuthenticated} onLogoutClick={handleLogout} />

            <main className="flex-1 py-6 sm:py-8 lg:py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-6"
                    >
                        <Button
                            variant="ghost"
                            onClick={() => setLocation(isAuthenticated ? "/dashboard" : "/")}
                            className="group hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back
                        </Button>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            Help & Support
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            We're here to help you make the most of Food Reminder
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        {/* Quick Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="border-0 shadow-lg">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                                            <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">24-48h</div>
                                            <div className="text-sm text-muted-foreground">Response Time</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="border-0 shadow-lg">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">24/7</div>
                                            <div className="text-sm text-muted-foreground">Support Available</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="border-0 shadow-lg">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                                            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">100%</div>
                                            <div className="text-sm text-muted-foreground">Secure & Private</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5" />
                                        Contact Us
                                    </CardTitle>
                                    <CardDescription>
                                        Send us a message and we'll get back to you soon
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category</Label>
                                            <select
                                                id="category"
                                                value={contactForm.category}
                                                onChange={(e) =>
                                                    setContactForm({ ...contactForm, category: e.target.value })
                                                }
                                                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                                            >
                                                <option value="general">General Inquiry</option>
                                                <option value="technical">Technical Issue</option>
                                                <option value="feature">Feature Request</option>
                                                <option value="billing">Billing Question</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input
                                                id="subject"
                                                value={contactForm.subject}
                                                onChange={(e) =>
                                                    setContactForm({ ...contactForm, subject: e.target.value })
                                                }
                                                placeholder="Brief description of your issue"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Message</Label>
                                            <Textarea
                                                id="message"
                                                value={contactForm.message}
                                                onChange={(e) =>
                                                    setContactForm({ ...contactForm, message: e.target.value })
                                                }
                                                placeholder="Provide details about your question or issue..."
                                                rows={6}
                                                required
                                            />
                                        </div>

                                        {currentUser && (
                                            <div className="p-3 rounded-lg bg-muted text-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="w-4 h-4" />
                                                    <span>We'll respond to: {currentUser.email}</span>
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>Sending...</>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* FAQs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <HelpCircle className="w-5 h-5" />
                                        Frequently Asked Questions
                                    </CardTitle>
                                    <CardDescription>
                                        Quick answers to common questions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                                    {faqs.map((faq, index) => (
                                        <div
                                            key={index}
                                            className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <h4 className="font-semibold mb-2">{faq.question}</h4>
                                                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Additional Contact Methods */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-12"
                    >
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                            <CardHeader>
                                <CardTitle>Other Ways to Reach Us</CardTitle>
                                <CardDescription>
                                    Choose the method that works best for you
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4">
                                    <Mail className="w-8 h-8 mx-auto mb-3 text-green-600" />
                                    <h4 className="font-semibold mb-2">Email</h4>
                                    <a
                                        href="mailto:support@foodreminder.app"
                                        className="text-sm text-green-600 hover:underline"
                                    >
                                        support@foodreminder.app
                                    </a>
                                </div>
                                <div className="text-center p-4">
                                    <MessageCircle className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                                    <h4 className="font-semibold mb-2">Live Chat</h4>
                                    <p className="text-sm text-muted-foreground">Coming Soon</p>
                                </div>
                                <div className="text-center p-4">
                                    <Users className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                                    <h4 className="font-semibold mb-2">Community</h4>
                                    <p className="text-sm text-muted-foreground">Join our Discord</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
