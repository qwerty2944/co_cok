'use client';

import { useState, useEffect } from 'react';
import { generateGroupInvite } from '../api/groups';

interface InviteModalProps {
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ groupId, groupName, isOpen, onClose }: InviteModalProps) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 새 초대 코드 생성
  async function handleGenerateCode() {
    setLoading(true);
    setError(null);
    setCopied(false);

    const result = await generateGroupInvite(groupId);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setCode(result.code!);
      setExpiresAt(new Date(result.expiresAt!));
    }
    setLoading(false);
  }

  // 카운트다운 타이머
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      setTimeLeft(Math.floor(remaining / 1000));

      if (remaining <= 0) {
        setCode(null);
        setExpiresAt(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setCode(null);
      setExpiresAt(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen]);

  // Web Share API
  async function handleShare() {
    if (!code) return;

    const inviteUrl = `${window.location.origin}/invite/${code}`;
    const shareData = {
      title: 'CO_COK 그룹 초대',
      text: `${groupName} 그룹에 초대받으셨어요! 5분 안에 참여해주세요.`,
      url: inviteUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // 사용자가 취소
      }
    } else {
      // Fallback: 클립보드 복사
      await handleCopyLink();
    }
  }

  // 링크 복사
  async function handleCopyLink() {
    if (!code) return;
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // 코드만 복사
  async function handleCopyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-gray-900">파트너 초대하기</h2>

        {!code ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              초대 코드를 생성하면 5분 동안 유효해요.
              <br />
              파트너에게 링크를 공유해주세요!
            </p>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateCode}
              disabled={loading}
              className="w-full rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white transition hover:bg-pink-600 disabled:opacity-50"
            >
              {loading ? '생성 중...' : '초대 코드 생성'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 코드 표시 */}
            <div
              className="cursor-pointer rounded-xl bg-gray-100 p-4 text-center transition hover:bg-gray-200"
              onClick={handleCopyCode}
            >
              <p className="mb-2 text-sm text-gray-500">초대 코드 (탭하여 복사)</p>
              <p className="font-mono text-3xl font-bold tracking-widest text-pink-500">
                {code}
              </p>
            </div>

            {/* 카운트다운 */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                남은 시간:{' '}
                <span className={`font-semibold ${timeLeft < 60 ? 'text-red-500' : 'text-gray-900'}`}>
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </p>
            </div>

            {/* 복사 완료 메시지 */}
            {copied && (
              <div className="rounded-lg bg-green-50 p-2 text-center text-sm text-green-600">
                복사되었어요!
              </div>
            )}

            {/* 공유 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                링크 복사
              </button>
              <button
                onClick={handleShare}
                className="flex-1 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white transition hover:bg-pink-600"
              >
                공유하기
              </button>
            </div>

            {/* 새 코드 생성 */}
            <button
              onClick={handleGenerateCode}
              disabled={loading}
              className="w-full text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {loading ? '생성 중...' : '새 코드 생성하기'}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
