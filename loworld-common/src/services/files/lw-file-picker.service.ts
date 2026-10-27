import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { Attachment } from '../models/document.model';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 📁 파일 선택 및 첨부 데이터 생성을 처리하는 공통 파일 서비스.
 * 브라우저 파일 다이얼로그와 파일 내보내기/다운로드를 캡슐화합니다.
 */
@Injectable({ providedIn: 'root' })
export class LwFilePickerService {
  private readonly document = inject(DOCUMENT);

  pickFile(options: { accept?: string; imagesOnly?: boolean } = {}): Promise<Attachment | null> {
    return new Promise((resolve) => {
      const doc = this.document;
      if (!doc) {
        resolve(null);
        return;
      }
      const input = doc.createElement('input');
      input.type = 'file';
      input.accept = options.accept || (options.imagesOnly ? 'image/*' : '*/*');
      input.style.display = 'none';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          const attachment = await this.fileToAttachment(file);
          resolve(attachment);
        } catch {
          resolve(null);
        } finally {
          input.remove();
        }
      };

      input.oncancel = () => {
        resolve(null);
        input.remove();
      };

      doc.body.appendChild(input);
      input.click();
    });
  }

  private readFileAsDataUrl(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('파일을 읽지 못했습니다.'));
      reader.readAsDataURL(file);
    });
  }

  async fileToAttachment(file: File): Promise<Attachment> {
    if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
      throw new Error('이미지는 5MB 이하만 첨부할 수 있습니다.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('파일은 10MB 이하만 첨부할 수 있습니다.');
    }

    const dataUrl = await this.readFileAsDataUrl(file);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    return {
      id,
      type: isImage ? 'image' : (isAudio ? 'audio' : 'file'),
      dataUrl,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      createdAt: new Date().toISOString(),
    };
  }

  downloadFile(fileName: string, content: string, mimeType = 'text/plain'): void {
    const doc = this.document;
    if (!doc) return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = doc.createElement('a');
    a.href = url;
    a.download = fileName;
    doc.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  }
}
