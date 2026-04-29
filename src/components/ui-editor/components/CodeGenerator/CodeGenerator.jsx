import React from 'react';
import useStore from '../../stores/useStore.js';
import './CodeGenerator.css';

const CodeGenerator = () => {
    const { generatedCode } = useStore();

    return (
        <div className="code-generator">
            <div className="code-content">
                <pre className="python-code">
                    <code>{generatedCode}</code>
                </pre>
            </div>
        </div>
    );
};

export default CodeGenerator;