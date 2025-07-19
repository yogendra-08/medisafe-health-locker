"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { Loader2, QrCode, X } from "lucide-react";
import type { HealthProfile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import QRCode from 'qrcode.react';
import { motion } from 'framer-motion';
import { User as UserIcon, Droplet, AlertTriangle, Phone, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// --- MOCK DATA ---
const MOCK_PROFILE: HealthProfile = {
    userId: 'test-user-id',
    fullName: 'Alex Doe',
    bloodGroup: 'O+',
    allergies: ['Peanuts', 'Pollen', 'Aspirin'],
    emergencyContact: {
        name: 'Jamie Doe',
        phone: '123-456-7890',
    },
    updatedAt: Timestamp.now(),
};

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  bloodGroup: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [allergyInput, setAllergyInput] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [isQrCodeOpen, setIsQrCodeOpen] = useState(false);
  const [emergencyUrl, setEmergencyUrl] = useState("");

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      bloodGroup: "",
      allergies: [],
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  const fetchProfile = useCallback(async (uid: string) => {
    setIsFetching(true);
    // Use mock data if the user is the test user
    if (uid === 'test-user-id') {
        const profile = MOCK_PROFILE;
        form.reset({
            fullName: profile.fullName || "",
            bloodGroup: profile.bloodGroup || "",
            allergies: profile.allergies || [],
            emergencyContactName: profile.emergencyContact?.name || "",
            emergencyContactPhone: profile.emergencyContact?.phone || "",
        });
        setAllergies(profile.allergies || []);
        setIsFetching(false);
        return;
    }

    // If not test user, fetch from Firestore
    if (!db) {
      console.log("Firestore not available");
      setIsFetching(false);
      return;
    };
    
    try {
        const docRef = doc(db, "profiles", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profile = docSnap.data() as HealthProfile;
          form.reset({
            fullName: profile.fullName || "",
            bloodGroup: profile.bloodGroup || "",
            allergies: profile.allergies || [],
            emergencyContactName: profile.emergencyContact?.name || "",
            emergencyContactPhone: profile.emergencyContact?.phone || "",
          });
          setAllergies(profile.allergies || []);
        }
    } catch(error) {
        console.error("Failed to fetch profile:", error);
        toast({ title: "Error", description: "Failed to load profile data.", variant: "destructive" });
    } finally {
        setIsFetching(false);
    }
  }, [form, toast]);

  useEffect(() => {
    if(user?.uid) {
        fetchProfile(user.uid);
        if (typeof window !== 'undefined') {
          setEmergencyUrl(`${window.location.origin}/emergency/${user.uid}`);
        }
    }
  }, [user, fetchProfile]);

  const addAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      const newAllergies = [...allergies, allergyInput.trim()];
      setAllergies(newAllergies);
      form.setValue("allergies", newAllergies);
      setAllergyInput("");
    }
  };

  const removeAllergy = (allergyToRemove: string) => {
    const newAllergies = allergies.filter(a => a !== allergyToRemove);
    setAllergies(newAllergies);
    form.setValue("allergies", newAllergies);
  };

  async function onSubmit(values: ProfileFormData) {
    if (!user) return;
    setIsLoading(true);

     // Handle mock data submission
    if (user.uid === 'test-user-id') {
        // Update the mock profile object in memory
        MOCK_PROFILE.fullName = values.fullName;
        MOCK_PROFILE.bloodGroup = values.bloodGroup;
        MOCK_PROFILE.allergies = allergies;
        MOCK_PROFILE.emergencyContact = {
            name: values.emergencyContactName || "",
            phone: values.emergencyContactPhone || ""
        };
        setTimeout(() => {
            toast({ title: "Success!", description: "Mock profile has been updated." });
            setIsLoading(false);
        }, 500); // Simulate network delay
        return;
    }

    if (!db) {
        toast({ title: "Error", description: "Database not connected.", variant: "destructive" });
        setIsLoading(false);
        return;
    };

    const profileData: Partial<HealthProfile> = {
      fullName: values.fullName,
      bloodGroup: values.bloodGroup,
      allergies: allergies,
      emergencyContact: {
        name: values.emergencyContactName || "",
        phone: values.emergencyContactPhone || "",
      },
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "profiles", user.uid), profileData, { merge: true });
      toast({ title: "Success!", description: "Your profile has been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching && !user) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid gap-8 md:grid-cols-2 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glassmorphism-card shadow-xl p-2">
            <CardHeader className="flex flex-col items-center gap-2">
              <Avatar className="h-16 w-16 mb-2">
                <AvatarFallback className="text-2xl bg-primary text-white">
                  {form.watch('fullName') ? form.watch('fullName').charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserIcon className="w-5 h-5 text-primary" /> Health Profile
              </CardTitle>
              <CardDescription className="text-center">
                Manage your personal and emergency health information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><UserCheck className="w-4 h-4 text-primary" /> Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bloodGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Droplet className="w-4 h-4 text-red-500" /> Blood Group</FormLabel>
                        <FormControl><Input placeholder="e.g., O+" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-yellow-500" /> Allergies</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={allergyInput}
                        onChange={e => setAllergyInput(e.target.value)}
                        placeholder="e.g., Peanuts"
                        onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addAllergy(); }}}
                      />
                      <Button type="button" variant="outline" onClick={addAllergy} className="hover:scale-105 transition-transform">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allergies.length > 0 ? allergies.map((allergy) => (
                        <Badge key={allergy} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center gap-1 hover:scale-105 transition-transform">
                          {allergy}
                          <button type="button" onClick={() => removeAllergy(allergy)} className="ml-1 text-xs">✕</button>
                        </Badge>
                      )) : <span className="text-sm text-muted-foreground px-2">No allergies added.</span>}
                    </div>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Phone className="w-4 h-4 text-blue-500" /> Emergency Contact Name</FormLabel>
                        <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Phone className="w-4 h-4 text-blue-500" /> Emergency Contact Phone</FormLabel>
                        <FormControl><Input placeholder="+1 234 567 890" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full font-semibold shadow-lg bg-gradient-to-r from-primary to-accent text-white hover:scale-105 transition-transform" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} Save Profile
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Card className="shadow-xl p-2 border-4 border-gradient-to-br from-primary to-accent animate-glow">
            <CardHeader className="flex flex-col items-center gap-2">
              <QrCode className="w-10 h-10 text-primary mb-2 animate-pulse" />
              <CardTitle className="text-lg font-semibold">Emergency QR Code</CardTitle>
              <CardDescription className="text-center">Generate a QR code that links to a public page with your essential health information for emergency situations.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Button size="lg" className="font-semibold shadow-md bg-gradient-to-r from-primary to-accent text-white hover:scale-105 transition-transform" onClick={() => setIsQrCodeOpen(true)}>
                <QrCode className="w-5 h-5 mr-2" /> Generate Emergency QR Code
              </Button>
              <Dialog open={isQrCodeOpen} onOpenChange={setIsQrCodeOpen}>
                <DialogContent className="flex flex-col items-center gap-4">
                  <DialogHeader>
                    <DialogTitle>Emergency QR Code</DialogTitle>
                    <DialogDescription>Scan this code to quickly access your blood group, allergies, and emergency contact.</DialogDescription>
                  </DialogHeader>
                  {emergencyUrl && (
                    <QRCode value={emergencyUrl} size={180} fgColor="#2563eb" bgColor="#fff" level="H" includeMargin={true} />
                  )}
                  <Button variant="outline" onClick={() => setIsQrCodeOpen(false)}>Close</Button>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
