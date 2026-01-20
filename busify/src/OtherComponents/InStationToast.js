import toast, { Toaster } from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import { useEffect, useRef } from "react";
import CloseButton from "react-bootstrap/CloseButton";

function InStationToast({ nearbyStop, onFilter, onDismiss }) {
    const toastIdRef = useRef(null);

    useEffect(() => {
        if (nearbyStop && !toastIdRef.current) {
            toastIdRef.current = toast(
                (t) => (
                    <div
                        onClick={() => {
                            onFilter(nearbyStop);
                            toast.dismiss(t.id);
                            toastIdRef.current = null;
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                                Stația {nearbyStop.stop_name}
                            </div>
                            <div style={{ fontSize: '0.85em', opacity: 0.7 }}>
                                Apasă pentru a filtra vehiculele
                            </div>
                        </div>
                        <CloseButton
                            onClick={(e) => {
                                e.stopPropagation();
                                onDismiss(nearbyStop.stop_id);
                                toast.dismiss(t.id);
                                toastIdRef.current = null;
                            }}
                            style={{
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: "gray"
                            }}
                        />
                    </div>
                ),
                {
                    duration: Infinity,
                    position: 'top-center',
                    style: {
                        borderRadius: '12px',
                        maxWidth: '90vw'
                    }
                }
            );
        } else if (!nearbyStop && toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
        }
    }, [nearbyStop, onFilter, onDismiss]);

    return <Toaster />;
}

export default InStationToast;
