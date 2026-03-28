import toast, { Toaster } from "react-hot-toast";
import { useEffect, useRef } from "react";
import CloseButton from "react-bootstrap/CloseButton";
import { IoInformationCircle, IoWarning, IoAlertCircle, IoCheckmarkCircle } from "react-icons/io5";

function NotificationToast({ show, onHide, title, message, type = 'success', duration = 8000 }) {
    const toastIdRef = useRef(null);

    const getIcon = () => {
        const iconStyle = { width: 24, height: 24, flexShrink: 0 };
        switch (type) {
            case 'info':
                return <IoInformationCircle style={{ ...iconStyle, color: '#3b82f6' }} />;
            case 'warning':
                return <IoWarning style={{ ...iconStyle, color: '#f59e0b' }} />;
            case 'alert':
                return <IoAlertCircle style={{ ...iconStyle, color: '#ef4444' }} />;
            case 'success':
            default:
                return <IoCheckmarkCircle style={{ ...iconStyle, color: '#10b981' }} />;
        }
    };

    useEffect(() => {
        if (show && !toastIdRef.current) {
            toastIdRef.current = toast(
                (t) => (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                    >
                        {getIcon()}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: message ? '2px' : 0 }}>
                                {title}
                            </div>
                            {message && (
                                <small style={{ opacity: 0.7 }}>
                                    {message}
                                </small>
                            )}
                        </div>
                        <CloseButton
                            onClick={(e) => {
                                e.stopPropagation();
                                toast.dismiss(t.id);
                                toastIdRef.current = null;
                                onHide();
                            }}
                            style={{
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: "gray"
                            }}
                        />
                    </div>
                ),
                {
                    duration: duration,
                    position: 'top-center',
                    style: {
                        borderRadius: '12px',
                        maxWidth: '90vw'
                    }
                }
            );
        } else if (!show && toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
        }
    }, [show, title, message, type, duration, onHide]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (toastIdRef.current) {
                toast.dismiss(toastIdRef.current);
                toastIdRef.current = null;
            }
        };
    }, []);

    return <Toaster />;
}

export default NotificationToast;
