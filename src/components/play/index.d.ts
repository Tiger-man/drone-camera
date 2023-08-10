type setPlayAddressData = {
  deviceId: string;
  playAddress: string;
  channelId: string;
  tracks?: Record<string, number>[]
};

type Device = {
  deviceId: string;
}

export { setPlayAddressData, Device }