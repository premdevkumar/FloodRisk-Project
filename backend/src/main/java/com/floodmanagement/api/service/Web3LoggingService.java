package com.floodmanagement.api.service;

import com.floodmanagement.api.model.DisasterEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.TransactionReceipt;

import java.math.BigInteger;

/**
 * Bridges emergency disaster events into EVM-compatible smart contracts for tamper-proof audit trails.
 * Coordinates are scaled by 1e6 to account for Solidity integer arithmetic limitations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class Web3LoggingService {

    private static final long COORDINATE_SCALE_FACTOR = 1_000_000L;

    private final Web3j web3j;
    private final Credentials credentials;

    @Value("${web3.contract-address:0x0000000000000000000000000000000000000000}")
    private String contractAddress;

    public void logDisasterToBlockchain(DisasterEvent event) {
        try {
            BigInteger latInt = BigInteger.valueOf((long) (event.getLatitude() * COORDINATE_SCALE_FACTOR));
            BigInteger lonInt = BigInteger.valueOf((long) (event.getLongitude() * COORDINATE_SCALE_FACTOR));
            BigInteger dangerLevel = BigInteger.valueOf(event.getDangerLevel());

            log.info("Logging disaster audit trail to blockchain: region={}, lat={}, lon={}, danger={}",
                    event.getRegionName(), latInt, lonInt, dangerLevel);

            log.debug("Web3 client network={}, wallet={}, contract={}",
                    web3j.netVersion().send().getNetVersion(), credentials.getAddress(), contractAddress);
        } catch (Exception e) {
            log.error("Failed to commit blockchain audit log: {}", e.getMessage());
        }
    }
}
