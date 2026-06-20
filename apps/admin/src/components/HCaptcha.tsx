import HCaptchaLib from "@hcaptcha/react-hcaptcha";
import { useRef } from "react";

interface Props {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

const SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

export default function HCaptcha({ onVerify, onExpire }: Props) {
  const ref = useRef<HCaptchaLib>(null);

  if (!SITE_KEY) return null;

  return (
    <HCaptchaLib
      ref={ref}
      sitekey={SITE_KEY}
      onVerify={onVerify}
      onExpire={onExpire}
      size="normal"
      theme="light"
    />
  );
}
