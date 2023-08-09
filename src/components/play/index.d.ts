type setPlayAddressData = {
  deviceId: string;
  playAddress: string;
  channelId: string;
  tracks?: Record<string, number>[]
};

type Device = {
  deviceId: string;
  channelId: string;
}

export { setPlayAddressData, Device }