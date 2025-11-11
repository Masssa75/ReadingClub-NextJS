import { supabase } from './supabase';
import { Profile, CalibrationData } from './types';

export async function getOrCreateProfile(profileName: string): Promise<Profile | null> {
  try {
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('name', profileName)
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    if (existingProfiles && existingProfiles.length > 0) {
      console.log(`✅ Found existing profile: ${profileName}`);
      return existingProfiles[0];
    }

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{ name: profileName }])
      .select()
      .single();

    if (createError) throw createError;

    console.log(`✅ Created new profile: ${profileName}`);
    return newProfile;
  } catch (error) {
    console.error('❌ Error with profile:', error);
    return null;
  }
}

export async function saveCalibrationToSupabase(
  profileId: string,
  letter: string,
  patternData: number[][],
  audioBlob?: Blob
): Promise<string | null> {
  try {
    const startTime = Date.now();
    let audioUrl: string | null = null;

    if (audioBlob) {
      const blobSizeKB = (audioBlob.size / 1024).toFixed(2);
      console.log(`📤 Uploading audio: ${blobSizeKB} KB`);

      const audioFileName = `${profileId}/${letter}_${Date.now()}.webm`;

      const uploadStart = Date.now();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('calibration-audio')
        .upload(audioFileName, audioBlob, {
          contentType: 'audio/webm'
        });
      const uploadTime = Date.now() - uploadStart;
      console.log(`⏱️ Upload took: ${uploadTime}ms`);

      if (uploadError) {
        console.error('❌ Audio upload error:', uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('calibration-audio')
          .getPublicUrl(audioFileName);
        audioUrl = publicUrl;
        console.log('✅ Audio uploaded:', audioUrl);
      }
    }

    console.log('💾 Saving to database...');
    const dbStart = Date.now();
    const { data, error } = await supabase
      .from('calibrations')
      .upsert({
        profile_id: profileId,
        letter: letter,
        pattern_data: { pattern: patternData },
        audio_url: audioUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id,letter'
      })
      .select();
    const dbTime = Date.now() - dbStart;
    console.log(`⏱️ Database save took: ${dbTime}ms`);

    if (error) throw error;

    const totalTime = Date.now() - startTime;
    console.log(`✅ Saved calibration for letter ${letter} (total: ${totalTime}ms)`);
    return audioUrl;
  } catch (error: any) {
    console.error('❌ Error saving calibration:', error);
    alert(`Failed to save calibration: ${error.message}`);
    return null;
  }
}

export async function loadCalibrationsFromSupabase(profileId: string): Promise<CalibrationData> {
  try {
    const { data, error } = await supabase
      .from('calibrations')
      .select('*')
      .eq('profile_id', profileId);

    if (error) throw error;

    const calibrations: CalibrationData = {};
    data?.forEach((cal: any) => {
      calibrations[cal.letter] = {
        pattern: cal.pattern_data.pattern || [cal.pattern_data],
        timestamp: new Date(cal.created_at).getTime(),
        audioUrl: cal.audio_url
      };
    });

    console.log(`✅ Loaded ${Object.keys(calibrations).length} calibrations from Supabase`);
    return calibrations;
  } catch (error) {
    console.error('❌ Error loading calibrations:', error);
    return {};
  }
}
