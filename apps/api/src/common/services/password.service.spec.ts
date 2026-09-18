import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash password using bcrypt with salt rounds 10', async () => {
    const plaintext = 'SuperSecret2026!';
    const hash = await service.hash(plaintext);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(plaintext);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
  });

  it('should return true when comparing matching plaintext password and hash', async () => {
    const plaintext = 'Password@123';
    const hash = await service.hash(plaintext);

    const isMatch = await service.compare(plaintext, hash);
    expect(isMatch).toBe(true);
  });

  it('should return false when comparing incorrect plaintext password and hash', async () => {
    const plaintext = 'Password@123';
    const hash = await service.hash(plaintext);

    const isMatch = await service.compare('WrongPassword@123', hash);
    expect(isMatch).toBe(false);
  });
});
