import React, { useState } from 'react';
import { app } from '@/lib/firebase';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { supabase } from '@/integrations/supabase/client';

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export default function PharaohMigrator() {
  const [status, setStatus] = useState('Idle');
  
  const handleMigrate = async () => {
    setStatus('Authenticating with Firebase...');
    try {
      await signInWithPopup(auth, provider);
      
      setStatus('Fetching documents from Firebase...');
      const docsToFetch = ['metrics', 'us', 'uk'];
      
      for (const docId of docsToFetch) {
        setStatus(`Fetching ${docId}...`);
        const snap = await getDoc(doc(db, "dashboard", docId));
        if (snap.exists()) {
          const payloadStr = snap.data().payload;
          const payload = JSON.parse(payloadStr);
          
          setStatus(`Inserting ${docId} into Supabase...`);
          const { error } = await supabase
            .from('pharaoh_data')
            .upsert({ id: docId, payload });
            
          if (error) throw error;
        } else {
          console.warn(`Doc ${docId} not found in Firebase`);
        }
      }
      
      setStatus('Migration Complete! All data is now in Supabase.');
    } catch (err) {
      setStatus('Error: ' + err.message);
      console.error(err);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
      <h2 className="font-bold mb-2">Pharaoh Data Migration (One-time)</h2>
      <p className="text-sm mb-4">Click below to fetch the dashboard JSON payloads from Firebase and insert them into Supabase.</p>
      <button 
        onClick={handleMigrate}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Migrate Firebase Data
      </button>
      <div className="mt-4 text-sm font-mono text-gray-700">{status}</div>
    </div>
  );
}
