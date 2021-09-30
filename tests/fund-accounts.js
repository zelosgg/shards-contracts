import { mintFlow, getAccountAddress } from "flow-js-testing"


const fund = async (...signers) => {
    for (const signer of signers) {
        const signerAddress = await getAccountAddress(signer)
        await mintFlow(signerAddress, "1.0")
    }
}

export default fund
