import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Smartphone, MessageCircle, Phone } from 'lucide-react';

// Simple UI components
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => (
  <div className="flex flex-col space-y-1.5 p-6">{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardContent = ({ children }) => (
  <div className="p-6 pt-0">{children}</div>
);

const Button = ({ children, onClick, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${className} ${
      disabled ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'
    }`}
  >
    {children}
  </button>
);

const Input = ({ type = 'text', placeholder, value, onChange, className = '' }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
);

const Alert = ({ children, className = '' }) => (
  <div className={`relative w-full rounded-lg border p-4 ${className}`}>{children}</div>
);

const AlertDescription = ({ children }) => (
  <div className="text-sm">{children}</div>
);

const DeviceConnection = () => {
  // Mock user data for now - in real app this would come from auth context
  const userId = 'user123';
  const email = 'rohit367673@gmail.com';
  const [telegramConnection, setTelegramConnection] = useState(null);
  const [whatsappConnection, setWhatsappConnection] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Poll connection status
  const pollConnectionStatus = (code, platform, setter) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/device-connection/${platform}/connection-status/${code}`);
        const data = await response.json();
        
        if (data.status === 'connected') {
          setter(prev => ({ ...prev, status: 'connected', ...data }));
          clearInterval(interval);
          loadConnectedDevices();
        } else if (data.status === 'expired') {
          setter(prev => ({ ...prev, status: 'expired' }));
          clearInterval(interval);
        }
      } catch (error) {
        console.error(`Error polling ${platform} status:`, error);
      }
    }, 2000);

    // Clear interval after 10 minutes
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
  };

  // Load user's connected devices
  const loadConnectedDevices = async () => {
    try {
      const response = await fetch(`/api/device-connection/user/${userId}/devices`);
      const data = await response.json();
      setConnectedDevices(data.devices || []);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  // Start Telegram connection
  const startTelegramConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/device-connection/telegram/start-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email })
      });
      
      const data = await response.json();
      if (data.success) {
        setTelegramConnection({
          ...data,
          status: 'pending'
        });
        pollConnectionStatus(data.connectionCode, 'telegram', setTelegramConnection);
      }
    } catch (error) {
      console.error('Telegram connection error:', error);
    }
    setLoading(false);
  };

  // Start WhatsApp connection
  const startWhatsAppConnection = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/device-connection/whatsapp/start-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, phoneNumber })
      });
      
      const data = await response.json();
      if (data.success) {
        setWhatsappConnection({
          ...data,
          status: 'pending'
        });
        pollConnectionStatus(data.connectionCode, 'whatsapp', setWhatsappConnection);
      }
    } catch (error) {
      console.error('WhatsApp connection error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConnectedDevices();
  }, [userId]);

  const ConnectionStatus = ({ connection, platform }) => {
    if (!connection) return null;

    const getStatusIcon = () => {
      switch (connection.status) {
        case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'pending': return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
        case 'expired': return <Clock className="w-5 h-5 text-red-500" />;
        default: return null;
      }
    };

    const getStatusText = () => {
      switch (connection.status) {
        case 'connected': return 'Connected Successfully!';
        case 'pending': return 'Waiting for connection...';
        case 'expired': return 'Connection expired. Please try again.';
        default: return '';
      }
    };

    return (
      <Alert className={`mt-4 ${connection.status === 'connected' ? 'border-green-500' : ''}`}>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <AlertDescription>
            <div className="font-medium">{getStatusText()}</div>
            {connection.status === 'pending' && (
              <div className="mt-2 text-sm">
                <strong>Instructions:</strong><br />
                {connection.instructions}
                <br />
                <strong>Code expires in:</strong> {Math.floor(connection.expiresIn / 60)} minutes
              </div>
            )}
            {connection.status === 'connected' && platform === 'telegram' && (
              <div className="mt-2 text-sm">
                <strong>Chat ID:</strong> {connection.chatId}<br />
                <strong>Username:</strong> @{connection.username}
              </div>
            )}
            {connection.status === 'connected' && platform === 'whatsapp' && (
              <div className="mt-2 text-sm">
                <strong>Phone:</strong> {connection.phoneNumber}<br />
                <strong>Chat ID:</strong> {connection.chatId}
              </div>
            )}
          </AlertDescription>
        </div>
      </Alert>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Devices</h1>
        <p className="text-gray-600">Connect Telegram and WhatsApp to receive daily schedule reminders</p>
      </div>

      {/* Connected Devices */}
      {connectedDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Connected Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectedDevices.map((device, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    {device.platform === 'telegram' ? 
                      <MessageCircle className="w-5 h-5 text-blue-500" /> : 
                      <Phone className="w-5 h-5 text-green-500" />
                    }
                    <div>
                      <div className="font-medium capitalize">{device.platform}</div>
                      <div className="text-sm text-gray-600">
                        {device.platform === 'telegram' ? `@${device.username}` : device.phoneNumber}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Connected {new Date(device.connectedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Telegram Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-500" />
            Connect Telegram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Connect your Telegram account to receive daily schedule reminders directly in Telegram.
          </p>
          
          <Button 
            onClick={startTelegramConnection}
            disabled={loading || telegramConnection?.status === 'pending'}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {telegramConnection?.status === 'pending' ? 'Connecting...' : 'Connect Telegram'}
          </Button>

          <ConnectionStatus connection={telegramConnection} platform="telegram" />
        </CardContent>
      </Card>

      {/* WhatsApp Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-6 h-6 text-green-500" />
            Connect WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Connect your WhatsApp number to receive daily schedule reminders on WhatsApp.
          </p>
          
          <div className="flex gap-3 mb-4">
            <Input
              type="tel"
              placeholder="Enter your phone number (e.g., 7807932322)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={startWhatsAppConnection}
              disabled={loading || whatsappConnection?.status === 'pending'}
              className="bg-green-500 hover:bg-green-600"
            >
              {whatsappConnection?.status === 'pending' ? 'Connecting...' : 'Connect WhatsApp'}
            </Button>
          </div>

          <ConnectionStatus connection={whatsappConnection} platform="whatsapp" />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <h4 className="font-medium">Click Connect</h4>
                <p className="text-gray-600 text-sm">Choose the platform you want to connect (Telegram or WhatsApp)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <h4 className="font-medium">Follow Instructions</h4>
                <p className="text-gray-600 text-sm">Send the provided code to our bot/number on your chosen platform</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <h4 className="font-medium">Start Receiving Reminders</h4>
                <p className="text-gray-600 text-sm">Once connected, you'll receive daily schedule reminders automatically</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceConnection;
