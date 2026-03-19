import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Icons from '../../components/common/Icons';
import './Error.css';

const ServerError = () => {
    const navigate = useNavigate();
    const [reportSent, setReportSent] = useState(false);

    const handleReport = () => {
        // Simulate sending error report
        setReportSent(true);
        setTimeout(() => setReportSent(false), 3000);
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="error-container server-error">
            <div className="error-content">
                <div className="error-animation">
                    <div className="error-number server">5</div>
                    <div className="error-number server">0</div>
                    <div className="error-number server">0</div>
                </div>

                <h1 className="error-title">Internal Server Error</h1>

                <p className="error-message">
                    Something went wrong on our end. We're working to fix it as quickly as possible.
                    <br />
                    Please try again in a few moments.
                </p>

                {reportSent && (
                    <Alert type="success" dismissible>
                        Thank you! Our team has been notified.
                    </Alert>
                )}

                <div className="error-actions">
                    <Button
                        variant="primary"
                        size="large"
                        onClick={handleRefresh}
                    >
                        <Icons.Refresh size={18} style={{ marginRight: '8px' }} />
                        Refresh Page
                    </Button>

                    <Button
                        variant="outline"
                        size="large"
                        onClick={handleReport}
                    >
                        <Icons.Mail size={18} style={{ marginRight: '8px' }} />
                        Report Problem
                    </Button>
                </div>

                <div className="error-help">
                    <p>Still having issues? <a href="/support">Contact Support</a></p>
                </div>
            </div>

            {/* Server Error Specific Decoration */}
            <div className="error-decoration">
                <div className="error-graph">
                    <div className="graph-line line-1"></div>
                    <div className="graph-line line-2"></div>
                    <div className="graph-line line-3"></div>
                    <div className="graph-line line-4"></div>
                </div>
                <div className="error-code-bg">500</div>
            </div>
        </div>
    );
};

export default ServerError;