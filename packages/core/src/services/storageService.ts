import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { getFirebaseStorage } from '../firebase/config';

/**
 * Upload a profile picture (from a data-URL) to Firebase Storage
 * and return the public download URL.
 */
export async function uploadProfilePicture(
  uid: string,
  gameType: string,
  dataUrl: string,
): Promise<string> {
  const storage = getFirebaseStorage();
  const storageRef = ref(
    storage,
    `profile-pictures/${gameType}/${uid}.png`,
  );

  // Convert the data-URL to a Blob for upload
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob, { contentType: 'image/png' });

  return getDownloadURL(storageRef);
}
