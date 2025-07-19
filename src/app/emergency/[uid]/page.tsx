"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { HealthProfile } from "@/types";
import { Loader2, User, HeartPulse, ShieldAlert, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";


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


export default function EmergencyPage({ params }: { params: { uid: string } }) {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!params.uid) {
        setError("Invalid user ID.");
        setIsLoading(false);
        return;
      }
      
      // Use mock data if the uid is the test user's id
      if(params.uid === 'test-user-id') {
        setProfile(MOCK_PROFILE);
        setIsLoading(false);
        return;
      }

      // If not test user, fetch from Firestore
      if (!db) {
        setError("Database connection not available.");
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "profiles", params.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as HealthProfile);
        } else {
          setError("Health profile not found.");
        }
      } catch (e) {
        console.error("Error fetching emergency profile:", e);
        setError("An error occurred while fetching the profile.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [params.uid]);

  const InfoRow = ({ label, value, children }: { label: string; value?: string | React.ReactNode; children?: React.ReactNode }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-base text-foreground sm:mt-0 sm:col-span-2">
        {value || children}
      </dd>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-red-50 dark:bg-red-900/20 px-4 py-8">
      <Card className="w-full max-w-2xl border-red-500 border-2 shadow-2xl shadow-red-500/20">
        <CardHeader className="bg-red-500 text-primary-foreground text-center p-6">
          <div className="flex justify-center mb-2">
            <HeartPulse className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl">Emergency Health Profile</CardTitle>
          <CardDescription className="text-red-200">
            This information is provided for emergency use only.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-destructive" /></div>}
          {error && (
            <div className="text-center text-destructive py-8">
              <ShieldAlert className="mx-auto h-12 w-12 mb-2" />
              <p>{error}</p>
            </div>
          )}
          {profile && (
            <dl className="divide-y divide-border">
              <InfoRow label="Full Name">
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-bold text-lg">{profile.fullName || "Not Provided"}</span>
                </div>
              </InfoRow>
              <InfoRow label="Blood Group">
                <Badge variant="destructive" className="text-lg">{profile.bloodGroup || "N/A"}</Badge>
              </InfoRow>
              <InfoRow label="Known Allergies">
                {profile.allergies && profile.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map(allergy => <Badge key={allergy} variant="outline">{allergy}</Badge>)}
                  </div>
                ) : "None specified"}
              </InfoRow>
               <div className="pt-6">
                <dt className="text-sm font-medium text-muted-foreground mb-2">Emergency Contact</dt>
                {profile.emergencyContact?.name || profile.emergencyContact?.phone ? (
                    <div className="bg-muted p-4 rounded-lg">
                        {profile.emergencyContact.name && <p className="font-semibold text-lg">{profile.emergencyContact.name}</p>}
                        {profile.emergencyContact.phone && 
                            <a href={`tel:${profile.emergencyContact.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                                <Phone className="h-4 w-4"/>
                                {profile.emergencyContact.phone}
                            </a>
                        }
                    </div>
                ): "Not provided"}
               </div>
            </dl>
          )}
        </CardContent>
        <div className="p-4 text-center text-xs text-muted-foreground border-t mt-4">
            Powered by <Logo className="inline-flex scale-75" />
        </div>
      </Card>
    </div>
  );
}
