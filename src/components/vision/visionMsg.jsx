import React from 'react';

class VisionMsg extends React.Component {
    render() {
        const {onClose} = this.props;


        return (
            <div style={styles.box}>
                <div style={styles.content}>
                    <span>检测到新版本，请更新</span>

                    <button style={styles.btn} onClick={onClose}>
                        ×
                    </button>
                </div>
            </div>
        );
    }
}

const styles = {
    box: {
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 99999
    },

    content: {
        background: '#ffcc00',
        padding: '8px 12px',
        borderRadius: 6,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
    },

    btn: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: 16
    }
};

export default VisionMsg;