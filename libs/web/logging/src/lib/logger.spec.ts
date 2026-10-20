import { TestBed } from '@angular/core/testing';
import { LOG_LEVEL, type LogLevel, Logger } from './logger';

describe('Logger', () => {
  const methods = ['debug', 'info', 'warn', 'error'] as const;

  const setup = (level?: LogLevel) => {
    TestBed.configureTestingModule({
      providers: level ? [{ provide: LOG_LEVEL, useValue: level }] : [],
    });
    const spies = Object.fromEntries(
      methods.map((m) => [
        m,
        vi.spyOn(console, m).mockImplementation(() => undefined),
      ]),
    ) as Record<(typeof methods)[number], ReturnType<typeof vi.spyOn>>;
    const logger = TestBed.inject(Logger);
    // Count only what the test writes, not the logger's own creation message.
    for (const spy of Object.values(spies)) spy.mockClear();
    return { logger, spies };
  };

  afterEach(() => vi.restoreAllMocks());

  it('writes the message and data to the matching console method', () => {
    const { logger, spies } = setup('debug');
    const error = new Error('boom');

    logger.error('Saving failed', error, { id: 1 });

    expect(spies.error).toHaveBeenCalledWith('Saving failed', error, { id: 1 });
  });

  it.each([
    ['debug', ['debug', 'info', 'warn', 'error']],
    ['info', ['info', 'warn', 'error']],
    ['warn', ['warn', 'error']],
    ['error', ['error']],
    ['off', []],
  ] as const)('at level %s writes only %j', (level, written) => {
    const { logger, spies } = setup(level);

    for (const m of methods) logger[m]('message');

    for (const m of methods) {
      expect(spies[m]).toHaveBeenCalledTimes(
        (written as readonly string[]).includes(m) ? 1 : 0,
      );
    }
  });

  it('logs its own creation at debug level', () => {
    const debug = vi
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);

    TestBed.inject(Logger);

    expect(debug).toHaveBeenCalledWith('Logger.constructor');
  });

  it('writes everything in dev mode by default', () => {
    const { logger, spies } = setup();

    logger.debug('message');

    expect(spies.debug).toHaveBeenCalledWith('message');
  });
});
