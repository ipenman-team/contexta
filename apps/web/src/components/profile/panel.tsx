"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMeProfile, useMeStore, type MeProfile } from "@/stores";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import { apiClient } from "@/lib/api";
import { Button } from "../ui/button";
import { UploadIcon } from "lucide-react";

export const UserProfilePanel = memo(function UserProfilePanel(
    props: { profile?: MeProfile | null } = {},
) {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pointerDownOutsideRef = useRef(false);

    const updateProfile = useMeStore((s) => s.updateProfile);
    const [openProfile, setOpenProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const formRef = useRef<HTMLFormElement | null>(null);
    const avatarInputRef = useRef<HTMLInputElement | null>(null);

    const [draftNickname, setDraftNickname] = useState("");
    const [draftAvatarUrl, setDraftAvatarUrl] = useState("");
    const [draftBio, setDraftBio] = useState("");

    const cachedProfile = useMeProfile();
    const profile = props.profile === undefined ? cachedProfile : props.profile;

    useEffect(() => {
        setMounted(true);
    }, []);

    const nickname = mounted ? profile?.nickname?.trim() || "" : "";
    const avatarUrl = mounted ? profile?.avatarUrl || undefined : undefined;
    const fallbackText = nickname ? nickname.slice(0, 1) : "CN";

    const profilePhone = mounted ? profile?.phone?.trim() || "" : "";

    const handleLogout = useCallback(async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } finally {
            setLoggingOut(false);
            router.replace("/login");
            router.refresh();
        }
    }, [loggingOut, router]);

    if (!mounted) {
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={undefined} />
                </Avatar>
            </div>
        );
    }

    const handleOpenProfile = () => {
        setProfileError(null);
        setDraftNickname(nickname);
        setDraftAvatarUrl(profile?.avatarUrl ?? "");
        setDraftBio(profile?.bio ?? "");
        setOpenProfile(true);
    };

    const handleUploadAvatar = async (file: File) => {
        if (uploadingAvatar) return;
        setProfileError(null);

        setUploadingAvatar(true);
        try {
            const fd = new FormData();
            fd.set("file", file);
            fd.set("from", "avatar");
            const { data: res } = await apiClient.post("/files/upload", fd);

            const data = res.data;
            if (!data || typeof data !== "object") {
                setProfileError("上传失败");
                return;
            }
            const url = data?.url;
            if (typeof url !== "string" || !url.trim()) {
                setProfileError("上传失败");
                return;
            }
            setDraftAvatarUrl(url.trim());
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        if (savingProfile || uploadingAvatar) return;
        setProfileError(null);

        const nextNickname = draftNickname.trim();
        if (!nextNickname) {
            setProfileError("请输入昵称");
            return;
        }

        const nextAvatarUrlRaw = draftAvatarUrl.trim();
        const nextBioRaw = draftBio.trim();

        setSavingProfile(true);
        try {
            const result = await updateProfile({
                nickname: nextNickname,
                avatarUrl: nextAvatarUrlRaw ? nextAvatarUrlRaw : null,
                bio: nextBioRaw ? nextBioRaw : null,
            });
            if (!result.ok) {
                setProfileError(result.message || "更新失败");
                return;
            }
            setOpenProfile(false);
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback>{fallbackText}</AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-56"
                align="start"
                onPointerDownOutside={() => {
                    pointerDownOutsideRef.current = true;
                }}
                onCloseAutoFocus={(e) => {
                    if (pointerDownOutsideRef.current) {
                        e.preventDefault();
                        pointerDownOutsideRef.current = false;
                    }
                }}
            >
                <DropdownMenuGroup>
                    <DropdownMenuItem disabled>
                        {nickname || "未设置昵称"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={handleOpenProfile}
                    >
                        个人资料
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        邀请成员
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault();
                            router.push("/settings");
                        }}
                    >
                        设置
                        <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    disabled={loggingOut}
                    onSelect={(e) => {
                        e.preventDefault();
                        void handleLogout();
                    }}
                >
                    退出登录
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>

            <Modal
                open={openProfile}
                title="个人资料"
                onOpenChange={(open) => {
                    setProfileError(null);
                    setOpenProfile(open);
                }}
                onConfirm={() => {
                    formRef.current?.requestSubmit();
                }}
                confirmText={savingProfile ? "更新中…" : "更新信息"}
                confirmDisabled={savingProfile || uploadingAvatar}
                cancelText="取消"
                className="w-[640px]"
            >
                <form
                    ref={formRef}
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSaveProfile();
                    }}
                >
                    <div className="w-full shrink-0 flex flex-col items-center">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={draftAvatarUrl.trim() || avatarUrl} />
                            <AvatarFallback>
                                {(draftNickname.trim() || nickname || "CN").slice(0, 1)}
                            </AvatarFallback>
                        </Avatar>

                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                void handleUploadAvatar(file);
                            }}
                            disabled={savingProfile || uploadingAvatar}
                        />
                        <div className="mt-2">
                            <Button
                                variant='ghost'
                                disabled={savingProfile || uploadingAvatar}
                                size='sm'
                                onClick={(e) => {
                                    e.preventDefault();
                                    avatarInputRef.current?.click()
                                }}
                            >
                                <UploadIcon className="w-4 h-4 text-gray-600" /> <span className="text-gray-600">{uploadingAvatar ? "上传中…" : "更新头像"}</span>
                            </Button>
                        </div>

                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                昵称 <span className="text-destructive">*</span>
                            </div>
                            <input
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                                value={draftNickname}
                                onChange={(e) => setDraftNickname(e.target.value)}
                                placeholder="请输入昵称"
                                required
                                disabled={savingProfile || uploadingAvatar}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">个人简介</div>
                            <textarea
                                className="min-h-24 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                                value={draftBio}
                                onChange={(e) => setDraftBio(e.target.value)}
                                placeholder="一句话介绍你自己"
                                disabled={savingProfile || uploadingAvatar}
                            />
                        </div>

                        {profilePhone ? (
                            <div className="space-y-2">
                                <div className="text-sm font-medium">手机号</div>
                                <input
                                    className="h-9 w-full rounded-md border bg-muted px-3 text-sm text-muted-foreground outline-none"
                                    value={profilePhone}
                                    disabled
                                />
                            </div>
                        ) : null}

                        {profileError ? (
                            <div className="text-sm text-destructive">
                                {profileError}
                            </div>
                        ) : null}
                    </div>
                </form>
            </Modal>
        </DropdownMenu>
    );
});
