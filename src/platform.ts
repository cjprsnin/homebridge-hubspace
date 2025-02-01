import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, Characteristic, PlatformConfig } from 'homebridge';
import { TokenService } from './services/token.service';
import { AccountService } from './services/account.service';
import { DiscoveryService } from './services/discovery.service';
import { DeviceService } from './services/device.service';
import { isConfigValid } from './config';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HubspacePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accountService: AccountService;
  public readonly deviceService: DeviceService;

  private readonly _discoveryService: DiscoveryService;
  private _isInitialized = false;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API
  ) {
    // Validate configuration
    if (!isConfigValid(config)) {
      this.log.error('Configuration is invalid. Platform will not start.');
      return;
    }

    // Initialize TokenService as a singleton
    TokenService.init(this.config.username, this.config.password);

    // Initialize services
    this._discoveryService = new DiscoveryService(this.log, this.config.baseURL);
    this.accountService = new AccountService(this.config.baseURL, TokenService.instance);
    this.deviceService = new DeviceService(this);

    // Configure callbacks
    this.accountService.onAccountLoaded = this._discoveryService.discoverDevices.bind(this._discoveryService);

    // Handle platform launch
    this.api.on('didFinishLaunching', async () => {
      try {
        await this.accountService.loadAccount();
      } catch (ex) {
        this.log.error('Failed to load account:', ex);
      }
    });

    // Mark platform as initialized
    this._isInitialized = true;
    this.log.info('HubspacePlatform initialized successfully.');
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    // Do not restore cached accessories if there was an error during initialization
    if (!this._isInitialized) {
      this.log.warn('Platform not initialized. Skipping cached accessory:', accessory.displayName);
      return;
    }

    // Configure the cached accessory
    this._discoveryService.configureCachedAccessory(accessory);
    this.log.info('Restored cached accessory:', accessory.displayName);
  }
}
