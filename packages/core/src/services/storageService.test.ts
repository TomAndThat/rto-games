import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { uploadProfilePicture } from './storageService';

vi.mock('../firebase/config', () => ({
  getFirebaseStorage: vi.fn(() => ({})),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// Mock the global fetch used for data-URL → Blob conversion
const mockBlob = new Blob(['fake-image'], { type: 'image/png' });
global.fetch = vi.fn().mockResolvedValue({
  blob: vi.fn().mockResolvedValue(mockBlob),
} as unknown as Response);

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({
    blob: vi.fn().mockResolvedValue(mockBlob),
  } as unknown as Response);

  vi.mocked(ref).mockReturnValue({} as ReturnType<typeof ref>);
  vi.mocked(uploadBytes).mockResolvedValue({} as Awaited<ReturnType<typeof uploadBytes>>);
  vi.mocked(getDownloadURL).mockResolvedValue('https://storage.example.com/pic.png');
});

describe('uploadProfilePicture', () => {
  it('returns the download URL from Firebase Storage', async () => {
    const url = await uploadProfilePicture(
      'uid-123',
      'catfish',
      'data:image/png;base64,abc',
    );

    expect(url).toBe('https://storage.example.com/pic.png');
  });

  it('creates a storage ref at the correct path', async () => {
    await uploadProfilePicture('uid-123', 'catfish', 'data:image/png;base64,abc');

    expect(vi.mocked(ref)).toHaveBeenCalledWith(
      expect.anything(),
      'profile-pictures/catfish/uid-123.png',
    );
  });

  it('calls uploadBytes with the converted blob and png content type', async () => {
    await uploadProfilePicture('uid-123', 'catfish', 'data:image/png;base64,abc');

    expect(vi.mocked(uploadBytes)).toHaveBeenCalledWith(
      expect.anything(),
      mockBlob,
      { contentType: 'image/png' },
    );
  });

  it('calls fetch with the provided data URL to convert it to a blob', async () => {
    const dataUrl = 'data:image/png;base64,abc123';
    await uploadProfilePicture('uid-123', 'catfish', dataUrl);

    expect(global.fetch).toHaveBeenCalledWith(dataUrl);
  });

  it('propagates upload errors', async () => {
    vi.mocked(uploadBytes).mockRejectedValue(new Error('upload failed'));

    await expect(
      uploadProfilePicture('uid-123', 'catfish', 'data:image/png;base64,abc'),
    ).rejects.toThrow('upload failed');
  });

  it('uses uid-specific path for different users', async () => {
    await uploadProfilePicture('different-uid', 'catfish', 'data:image/png;base64,abc');

    expect(vi.mocked(ref)).toHaveBeenCalledWith(
      expect.anything(),
      'profile-pictures/catfish/different-uid.png',
    );
  });
});
