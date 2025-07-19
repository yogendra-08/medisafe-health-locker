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
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Health Profile</CardTitle>
            <CardDescription>
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
                      <FormLabel>Full Name</FormLabel>
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
                      <FormLabel>Blood Group</FormLabel>
                      <FormControl><Input placeholder="e.g., O+" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                    <FormLabel>Allergies</FormLabel>
                    <div className="flex gap-2">
                        <Input 
                            value={allergyInput} 
                            onChange={e => setAllergyInput(e.target.value)} 
                            placeholder="e.g., Peanuts"
                            onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addAllergy(); }}}
                        />
                        <Button type="button" onClick={addAllergy}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {allergies.map(allergy => (
                             <Badge key={allergy} variant="secondary">
                                {allergy}
                                <button type="button" onClick={() => removeAllergy(allergy)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </FormItem>
                <CardTitle className="text-lg pt-4">Emergency Contact</CardTitle>
                 <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
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
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl><Input type="tel" placeholder="+1 234 567 890" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Profile
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Emergency QR Code</CardTitle>
                <CardDescription>
                    Generate a QR code that links to a public page with your essential health information for emergency situations.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    First responders can scan this code to quickly access your blood group, allergies, and emergency contact.
                </p>
                <Button onClick={() => setIsQrCodeOpen(true)} disabled={!user}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate Emergency QR Code
                </Button>
            </CardContent>
        </Card>
      </div>
      <Dialog open={isQrCodeOpen} onOpenChange={setIsQrCodeOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Your Emergency QR Code</DialogTitle>
                <DialogDescription>
                    Save or print this QR code and keep it in your wallet or on your phone lock screen.
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
                <div className="bg-white p-4 rounded-lg border">
                    <QRCode value={emergencyUrl} size={256} />
                </div>
                <a href={emergencyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                    {emergencyUrl}
                </a>
            </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
